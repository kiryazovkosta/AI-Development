# Copilot instructions (mondrAIn)

## Project name
- The project/app name is **mondrAIn**.

## Core idea (product)
- Build a playful desktop app for **creative image transformations** (exploration-first, not pro photo editing).
- Users load an image, experiment with transformations + parameters, preview results, and export outputs.

## User capabilities (must support)
- Open an existing image file from device.
- Show **before/after** preview (original vs transformed).
- Apply transformations:
  - Grayscale
  - Flip/mirror
  - ASCII-art conversion (recognizable structure; grid-based; brightness→character mapping)
  - Color swap/shift using predefined palettes and/or an auto-generated color distribution table
- Adjust parameters via UI controls (examples: ASCII density/character ramp, brightness/contrast, grid size).
- Combine multiple transformations (stack/order matters) and preview the composed output.
- Export:
  - ASCII art to `.txt`
  - Transformed image to `.png`

## Stack & current state
- Tech stack is **C# + .NET MAUI**.
- This repo is currently **uninitialized/empty** (no solution/projects yet). Don’t invent architecture that isn’t present.

## First step when implementing features
- If no MAUI app exists yet, scaffold the minimal baseline first (then implement the feature on top):
  - `dotnet new maui -n AiImageTransformations`
  - If a solution file is desired: `dotnet new sln -n AiImageTransformations` then `dotnet sln add AiImageTransformations/AiImageTransformations.csproj`
- Confirm target platforms if it affects the work (Windows vs Android/iOS/MacCatalyst), and whether images come from:
  - local file picker, app package resources, camera, or remote URLs

## Project conventions (prefer standard MAUI patterns)
- Use **MVVM**:
  - UI in `*.xaml` + `*.xaml.cs`
  - State/logic in `*ViewModel.cs` using `INotifyPropertyChanged` (or `ObservableObject` if a MVVM toolkit is introduced).
- Keep image transformation logic isolated from UI:
  - Put pure transformation code in a dedicated service/class (e.g., `Services/` or `Core/`) and keep it UI-framework-agnostic.
- Prefer MAUI DI over singletons:
  - Register services/viewmodels in `MauiProgram.cs`.
- Navigation:
  - Prefer Shell (`AppShell.xaml`) if the app uses multiple pages.

## Transformation design constraints (project-specific)
- Design transformations to be **composable** (e.g., pipeline/list of steps) so multiple filters can be applied in sequence.
- Keep ASCII generation deterministic and parameter-driven:
  - grid cell size controls spatial resolution
  - character ramp controls density (e.g., ` .:-=+*#%@`)
  - preserve aspect ratio (account for character cell aspect when rendering text)
- Keep exports separate from UI: provide a service that outputs `Stream`/text for saving.

## Build/run workflows (commands must work from repo root)
- Verify SDK/workloads:
  - `dotnet --info`
  - If needed: `dotnet workload install maui`
- Build:
  - `dotnet build`
- Run (platform examples):
  - `dotnet build -t:Run -f net8.0-windows10.0.19041.0`
  - `dotnet build -t:Run -f net8.0-android`

## Dependencies & imaging approach
- Prefer built-in APIs when sufficient:
  - `FilePicker`/`MediaPicker` for input, `ImageSource`/`StreamImageSource` for display.
- If you introduce a third-party imaging library (e.g., SkiaSharp), document:
  - why it’s needed,
  - where it’s used,
  - and the exact install steps.

## Minimal verification
- If tests exist, use `dotnet test`.
- Otherwise, add a tiny manual verification note in `README.md` (input → expected output) for the implemented transformation.
