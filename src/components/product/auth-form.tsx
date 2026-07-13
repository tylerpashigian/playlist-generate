import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Heading4, Text } from '@/components/ui/typography'
import { useAuthSession } from '@/hooks/use-auth-session'
import { HugeiconsIcon } from '@hugeicons/react'
import { SpotifyIcon } from '@hugeicons/core-free-icons'

import type {
  ValidationLogicFn,
  ValidationLogicValidatorsFn,
} from '@tanstack/react-form'

interface AuthFormValues {
  name: string
  email: string
  password: string
}

const defaultAuthFormValues: AuthFormValues = {
  name: '',
  email: '',
  password: '',
}

function validateName(value: string) {
  return value.trim() ? undefined : 'Name is required'
}

function validateEmail(value: string) {
  return value.trim() && value.includes('@') ? undefined : 'Enter a valid email'
}

function validatePassword(value: string) {
  return value.length >= 8
    ? undefined
    : 'Password must be at least 8 characters'
}

const touchedFieldValidationLogic: ValidationLogicFn = ({
  event,
  form,
  runValidation,
  validators,
}) => {
  const shouldValidate =
    event.type === 'blur' || event.type === 'change' || event.type === 'submit'

  const dynamicValidator: ValidationLogicValidatorsFn | undefined =
    shouldValidate
      ? {
          cause: 'dynamic',
          fn: event.async ? validators?.onDynamicAsync : validators?.onDynamic,
        }
      : undefined

  return runValidation({
    validators: [dynamicValidator],
    form,
  })
}

export function AuthForm({ redirect = '/app' }: { redirect?: string }) {
  const auth = useAuthSession()
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const form = useForm({
    defaultValues: defaultAuthFormValues,
    validationLogic: touchedFieldValidationLogic,
    onSubmit: async ({ value }) => {
      const success = isSignUp
        ? await auth.signUp({
            email: value.email,
            password: value.password,
            name: value.name,
          })
        : await auth.signIn({
            email: value.email,
            password: value.password,
          })

      if (success) {
        await navigate({ to: redirect })
      }
    },
  })

  if (auth.isSessionLoading) {
    return (
      <AuthCard>
        <Text size="sm" className="text-muted-foreground">
          Checking session
        </Text>
      </AuthCard>
    )
  }

  if (auth.user) {
    return (
      <AuthCard>
        <div className="space-y-1">
          <Text size="sm" weight="semibold" className="text-muted-foreground">
            Account
          </Text>
          <Heading4 className="text-foreground">{auth.user.name}</Heading4>
          <Text size="sm" className="text-muted-foreground">
            {auth.user.email}
          </Text>
        </div>
        <div className="mt-6 grid gap-3">
          <Button
            type="button"
            onClick={() => {
              void navigate({ to: redirect })
            }}
          >
            Continue
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void auth.signOut()
            }}
          >
            Sign out
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <div className="space-y-1">
        <Text size="sm" weight="semibold" className="text-muted-foreground">
          Account
        </Text>
        <Heading4 className="text-foreground">
          {isSignUp ? 'Create account' : 'Sign in'}
        </Heading4>
        <Text size="sm" className="text-muted-foreground">
          Use email or Spotify to access your app account.
        </Text>
      </div>

      <Button
        type="button"
        variant="outline"
        className="mt-6 w-full"
        disabled={auth.isAuthenticating}
        onClick={() => {
          void auth.signInWithSpotify(redirect)
        }}
      >
        <>{auth.isAuthenticating ? 'Please wait' : 'Continue with Spotify'}</>
        <HugeiconsIcon icon={SpotifyIcon} />
      </Button>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <Text as="span" size="xs" className="text-muted-foreground">
          or
        </Text>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        {isSignUp ? (
          <form.Field
            name="name"
            validators={{
              onDynamic: ({ value }) => validateName(value),
            }}
          >
            {(field) => (
              <Field
                id={field.name}
                label="Name"
                value={field.state.value}
                error={getFieldError(field.state.meta)}
                autoComplete="name"
                onBlur={field.handleBlur}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
        ) : null}
        <form.Field
          name="email"
          validators={{
            onDynamic: ({ value }) => validateEmail(value),
          }}
        >
          {(field) => (
            <Field
              id={field.name}
              label="Email"
              type="email"
              value={field.state.value}
              error={getFieldError(field.state.meta)}
              autoComplete="email"
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>
        <form.Field
          name="password"
          validators={{
            onDynamic: ({ value }) => validatePassword(value),
          }}
        >
          {(field) => (
            <Field
              id={field.name}
              label="Password"
              type="password"
              value={field.state.value}
              error={getFieldError(field.state.meta)}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        {auth.authError ? (
          <Text size="sm" className="text-red-600">
            {auth.authError}
          </Text>
        ) : null}

        <form.Subscribe
          selector={(state) =>
            [state.values, state.isFieldsValid, state.isSubmitting] as const
          }
        >
          {([values, isFieldsValid, isSubmitting]) => {
            const hasRequiredValues =
              values.email.trim() &&
              values.password &&
              (!isSignUp || values.name.trim())

            return (
              <Button
                type="submit"
                disabled={
                  !hasRequiredValues ||
                  !isFieldsValid ||
                  isSubmitting ||
                  auth.isAuthenticating
                }
              >
                {isSubmitting || auth.isAuthenticating
                  ? 'Please wait'
                  : isSignUp
                    ? 'Create account'
                    : 'Sign in'}
              </Button>
            )
          }}
        </form.Subscribe>
      </form>

      <Button
        type="button"
        variant="link"
        className="mt-4 h-auto p-0"
        onClick={() => {
          setIsSignUp((value) => !value)
          form.reset(defaultAuthFormValues)
        }}
      >
        {isSignUp ? 'Use an existing account' : 'Create a new account'}
      </Button>
    </AuthCard>
  )
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      {children}
    </section>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  error?: string
  type?: string
  autoComplete?: string
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      {label}
      <Input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="bg-background font-normal"
        required
      />
      {error ? (
        <Text
          as="span"
          id={`${id}-error`}
          size="sm"
          className="text-destructive"
        >
          {error}
        </Text>
      ) : null}
    </label>
  )
}

function getFieldError(meta: { isTouched: boolean; errors: Array<unknown> }) {
  if (!meta.isTouched) {
    return undefined
  }

  const error = meta.errors[0]

  return typeof error === 'string' ? error : undefined
}
