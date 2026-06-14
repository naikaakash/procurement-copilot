using SapAssistant.Api.Auth;
using SapAssistant.Api.Chat;
using SapAssistant.Api.Endpoints;
using SapAssistant.Api.Storage;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();
builder.Services.AddOpenApi();

builder.Services.AddSapAuth(builder.Configuration, builder.Environment);

builder.Services.AddSingleton<IContestRepository, InMemoryContestRepository>();
builder.Services.AddSingleton<IChatService, StubChatService>();

var app = builder.Build();

app.MapDefaultEndpoints();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api");
api.MapGet("/hello", () => new { message = "Hello from SapAssistant.Api", utc = DateTime.UtcNow })
   .WithName("Hello");

app.MapAccountEndpoints(builder.Configuration);
app.MapContestEndpoints();
app.MapChatEndpoints();

app.Run();

public partial class Program;
