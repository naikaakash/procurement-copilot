---
mode: agent
description: Add a new authenticated Minimal API endpoint to SapAssistant.Api
---

# Add a new endpoint to `SapAssistant.Api`

Follow these steps in order. Each step is small enough to verify before moving on.

## Inputs you need

- **Feature name** (e.g. `Contest`, `Chat`) — drives file/method naming.
- **HTTP method + route** (e.g. `POST /api/contest/entries`).
- **Request DTO** (or none).
- **Response DTO** (or none).
- **Auth?** Default **yes**. Opt out only with explicit reason.

## Files to touch

1. **Create or extend** `src/SapAssistant.Api/Endpoints/{Feature}Endpoints.cs`:
   - One `public static IEndpointRouteBuilder Map{Feature}Endpoints(this IEndpointRouteBuilder app)`.
   - Group: `var g = app.MapGroup("/api/{feature}").RequireAuthorization();`
   - Use `Results.Ok(...)` for success, `Results.Problem(...)` for failure.
   - Inject dependencies via lambda parameters (Minimal API DI binding).

2. **DTOs**: place records at the bottom of the endpoints file OR (if reused)
   in `src/SapAssistant.Api/{Feature}/Dtos.cs`.

3. **Services**: if the endpoint needs new business logic, add an
   `I{Thing}Service` + implementation in `src/SapAssistant.Api/{Feature}/`.
   Register in `Program.cs` next to the other services.

4. **Register the map** in `src/SapAssistant.Api/Program.cs` — add
   `app.Map{Feature}Endpoints();` next to the existing `MapContestEndpoints()`,
   `MapChatEndpoints()`, etc.

5. **Tests**:
   - xUnit test in `tests/SapAssistant.Api.Tests/Endpoints/{Feature}EndpointsTests.cs`
     using `WebApplicationFactory<Program>` with `ASPNETCORE_ENVIRONMENT=Testing`.
   - If user-visible, add a Playwright spec in `tests/e2e/tests/{feature}.spec.ts`
     using the `signIn` helper.

## Conventions reminder

- Cancellation tokens on every async path.
- Structured logging via `ILogger<T>` — no `Console.WriteLine`.
- `Results.Problem` for failures (RFC 7807). Never `Results.BadRequest("plain string")`.
- Records, not classes, for DTOs.
- No `[Authorize]` attribute on Minimal APIs — use `.RequireAuthorization()` on the group.

## Verification

```bash
dotnet build SapAssistant.sln
dotnet test SapAssistant.sln
cd tests/e2e && npm run prepare:all && npm test
```

All three must pass before opening a PR.
