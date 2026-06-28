import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthSession } from '@/hooks/use-auth-session'

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
        <p className="text-sm text-muted-foreground">Checking session</p>
      </AuthCard>
    )
  }

  if (auth.user) {
    return (
      <AuthCard>
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground">Account</p>
          <h1 className="text-2xl font-semibold text-foreground">
            {auth.user.name}
          </h1>
          <p className="text-sm text-muted-foreground">{auth.user.email}</p>
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
        <p className="text-sm font-bold text-muted-foreground">Account</p>
        <h1 className="text-2xl font-semibold text-foreground">
          {isSignUp ? 'Create account' : 'Sign in'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your app account first, then connect Spotify from your profile.
        </p>
      </div>

      <form
        className="mt-6 grid gap-4"
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
          <p className="text-sm text-red-600">{auth.authError}</p>
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
        <span id={`${id}-error`} className="text-sm font-normal text-red-600">
          {error}
        </span>
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
