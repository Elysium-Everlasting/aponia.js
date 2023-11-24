## Providers

Providers are categorized into four categories:
- Credentials
- Email
- OAuth
- OIDC

The static `id` property of those classes represents the category.
When a provider is initialized with a user config,
it gets an `id` ___instance property___ which uniquely identifies the provider that validates authentication information.


For example, `Google` is an `OIDC` provider that's identified by its ID, `Google`.

In some cases, the provider type and its ID may be the same.
For example, there is basically only one way to obtain credentials with username/password.
So the `Credentials` provider is a `Credentials` provider that's identified by its ID, `Credentials`.

A future TODO might be to develop different types of credential providers.
So maybe it might be more straightforward to say something like:

A `Username/Password` provider is a `Credentials` provider that's identified by its ID, `username/password`
A `MFA` provider is a `Credentials` provider that's identified by its ID, `MFA`

And the MFA might feasibly be a system where you enter a single code (i.e. "credential")
and the verification is completed on a second device.
