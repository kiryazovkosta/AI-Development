using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using AiImageTransformations.Commands;
using Microsoft.Maui.ApplicationModel;

namespace AiImageTransformations.ViewModels;

public sealed class MainViewModel : INotifyPropertyChanged
{
	private ImageSource? _selectedImage;

	public MainViewModel()
	{
		PickImageCommand = new AsyncRelayCommand(PickImageAsync);
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
		}
	}

	public bool HasImage => SelectedImage is not null;
	public bool HasNoImage => !HasImage;

	public ICommand PickImageCommand { get; }

	private async Task PickImageAsync()
	{
		try
		{
			var fileResult = await FilePicker.PickAsync(new PickOptions
			{
				PickerTitle = "Select an image",
				FileTypes = FilePickerFileType.Images,
			}).ConfigureAwait(true);

			if (fileResult is null)
				return;

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

			await MainThread.InvokeOnMainThreadAsync(() =>
			{
				SelectedImage = ImageSource.FromFile(cachedPath);
			});
		}
		catch (Exception ex)
		{
			if (Shell.Current is not null)
				await MainThread.InvokeOnMainThreadAsync(() => Shell.Current.DisplayAlertAsync("Error", ex.Message, "OK"));
		}
	}

	private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
		=> PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
}
