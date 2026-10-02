using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using AiImageTransformations.Commands;
using AiImageTransformations.Services;
using Microsoft.Maui.ApplicationModel;

namespace AiImageTransformations.ViewModels;

public sealed class MainViewModel : INotifyPropertyChanged
{
	private readonly IImageTransformationService _transformationService;
	private ImageSource? _selectedImage;
	private string? _originalImagePath;
	private string? _currentImagePath;
	private bool _isBusy;
	private string _statusMessage = string.Empty;

	public MainViewModel(IImageTransformationService transformationService)
	{
		_transformationService = transformationService;
		PickImageCommand = new AsyncRelayCommand(PickImageAsync);
		ApplyGrayscaleCommand = new AsyncRelayCommand(ApplyGrayscaleAsync);
		RestoreCommand = new AsyncRelayCommand(RestoreAsync);
	}

	public event PropertyChangedEventHandler? PropertyChanged;

	public string Title => "mondrAIn";

	public ImageSource? SelectedImage
	{
		get => _selectedImage;
		private set
		{
			if (ReferenceEquals(_selectedImage, value))
				return;

			_selectedImage = value;
			OnPropertyChanged();
			OnPropertyChanged(nameof(HasImage));
			OnPropertyChanged(nameof(HasNoImage));
			OnPropertyChanged(nameof(CanApplyGrayscale));
			OnPropertyChanged(nameof(CanRestore));
		}
	}

	public bool HasImage => SelectedImage is not null;
	public bool HasNoImage => !HasImage;
	public bool CanPickImage => !IsBusy;
	public bool CanApplyGrayscale => !IsBusy && HasImage && !string.IsNullOrEmpty(_currentImagePath);
	public bool CanRestore =>
		!IsBusy &&
		HasImage &&
		!string.IsNullOrEmpty(_originalImagePath) &&
		!string.IsNullOrEmpty(_currentImagePath) &&
		!string.Equals(_currentImagePath, _originalImagePath, StringComparison.OrdinalIgnoreCase) &&
		File.Exists(_originalImagePath);

	public bool IsBusy
	{
		get => _isBusy;
		private set
		{
			if (_isBusy == value)
				return;
			_isBusy = value;
			OnPropertyChanged();
			OnPropertyChanged(nameof(CanPickImage));
			OnPropertyChanged(nameof(CanApplyGrayscale));
			OnPropertyChanged(nameof(CanRestore));
		}
	}

	public string StatusMessage
	{
		get => _statusMessage;
		private set
		{
			if (_statusMessage == value)
				return;
			_statusMessage = value;
			OnPropertyChanged();
		}
	}

	public ICommand PickImageCommand { get; }
	public ICommand ApplyGrayscaleCommand { get; }
	public ICommand RestoreCommand { get; }

	private async Task PickImageAsync()
	{
		IsBusy = true;
		StatusMessage = "Loading image...";

		try
		{
			var fileResult = await FilePicker.PickAsync(new PickOptions
			{
				PickerTitle = "Select an image",
				FileTypes = FilePickerFileType.Images,
			}).ConfigureAwait(true);

			if (fileResult is null)
			{
				StatusMessage = string.Empty;
				return;
			}

			await using var input = await fileResult.OpenReadAsync().ConfigureAwait(true);
			var ext = Path.GetExtension(fileResult.FileName);
			if (string.IsNullOrWhiteSpace(ext))
				ext = ".img";

			var cachedPath = Path.Combine(
				FileSystem.CacheDirectory,
				$"mondrAIn_{Guid.NewGuid():N}{ext}");

			await using (var output = File.Create(cachedPath))
			{
				await input.CopyToAsync(output).ConfigureAwait(true);
			}

			_originalImagePath = cachedPath;
			_currentImagePath = cachedPath;
			OnPropertyChanged(nameof(CanApplyGrayscale));
			OnPropertyChanged(nameof(CanRestore));

			await MainThread.InvokeOnMainThreadAsync(() =>
			{
				SelectedImage = ImageSource.FromFile(cachedPath);
				StatusMessage = "Image loaded successfully";
			});
		}
		catch (Exception ex)
		{
			StatusMessage = $"Error: {ex.Message}";
			if (Shell.Current is not null)
				await MainThread.InvokeOnMainThreadAsync(() => Shell.Current.DisplayAlertAsync("Error", ex.Message, "OK"));
		}
		finally
		{
			IsBusy = false;
		}
	}

	private async Task ApplyGrayscaleAsync()
	{
		if (!CanApplyGrayscale)
			return;

		var sourceImagePath = _currentImagePath!;

		IsBusy = true;
		StatusMessage = "Applying grayscale transformation...";

		try
		{
			// Apply grayscale transformation
			var grayscaleStream = await _transformationService.ApplyGrayscaleAsync(sourceImagePath).ConfigureAwait(true);

			// Save to cache with new filename
			var cachedPath = Path.Combine(
				FileSystem.CacheDirectory,
				$"mondrAIn_{Guid.NewGuid():N}_grayscale.png");

			await using (var output = File.Create(cachedPath))
			{
				await grayscaleStream.CopyToAsync(output).ConfigureAwait(true);
			}

			_currentImagePath = cachedPath;
			OnPropertyChanged(nameof(CanApplyGrayscale));
			OnPropertyChanged(nameof(CanRestore));

			await MainThread.InvokeOnMainThreadAsync(() =>
			{
				SelectedImage = ImageSource.FromFile(cachedPath);
				StatusMessage = "Grayscale applied successfully";
			});
		}
		catch (Exception ex)
		{
			StatusMessage = $"Error: {ex.Message}";
			if (Shell.Current is not null)
				await MainThread.InvokeOnMainThreadAsync(() => Shell.Current.DisplayAlertAsync("Error", ex.Message, "OK"));
		}
		finally
		{
			IsBusy = false;
		}
	}

	private async Task RestoreAsync()
	{
		if (!CanRestore)
			return;

		IsBusy = true;
		StatusMessage = "Restoring original image...";

		try
		{
			if (string.IsNullOrEmpty(_originalImagePath) || !File.Exists(_originalImagePath))
			{
				StatusMessage = "Unable to restore: original image is no longer available";
				return;
			}

			_currentImagePath = _originalImagePath;
			OnPropertyChanged(nameof(CanApplyGrayscale));
			OnPropertyChanged(nameof(CanRestore));

			await MainThread.InvokeOnMainThreadAsync(() =>
			{
				SelectedImage = ImageSource.FromFile(_originalImagePath);
				StatusMessage = "Original image restored successfully";
			});
		}
		catch (Exception ex)
		{
			StatusMessage = $"Error: {ex.Message}";
		}
		finally
		{
			IsBusy = false;
		}
	}

	private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
		=> PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
}
