# Extensions needed
1. .NET Install Tool
2. C#
3. C# Dev Kit


# Appointment System

This is the backend for the Appointment System application, built using ASP.NET Core 8.0.

## Prerequisites

- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

## Getting Started

Follow these steps to set up and run the application locally:

### 1. Trust Development Certificates
If this is your first time running an ASP.NET Core project on your machine, you may need to trust the development certificates:

```bash
dotnet dev-certs https --trust
```

### 2. Restore Dependencies
Restore the NuGet packages required for the project:

```bash
dotnet restore
```

### 3. Build the Application
Compile the source code:

```bash
dotnet build
```

### 4. Run the Application
Start the development server:

```bash
dotnet run --project Appointment-System/Appointment-System.csproj
```

The application will typically start on `https://localhost:5001` or `http://localhost:5000`. Check the console output for the exact URL.

## Development

### Auto-Reload
To automatically rebuild and restart the application when you make changes to the code, use:

```bash
dotnet watch --project Appointment-System/Appointment-System.csproj
```

### Testing APIs
You can use the `Appointment-System/Appointment-System.http` file with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension in VS Code to test the API endpoints.
