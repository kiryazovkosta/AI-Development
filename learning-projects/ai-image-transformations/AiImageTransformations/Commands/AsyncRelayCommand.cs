using System.Windows.Input;
using Microsoft.Maui.ApplicationModel;

namespace AiImageTransformations.Commands;

public sealed class AsyncRelayCommand : ICommand
{
	private readonly Func<Task> _execute;
	private bool _isExecuting;

	public AsyncRelayCommand(Func<Task> execute)
	{
		_execute = execute ?? throw new ArgumentNullException(nameof(execute));
	}

	public event EventHandler? CanExecuteChanged;

	private void RaiseCanExecuteChanged()
	{
		if (MainThread.IsMainThread)
		{
			CanExecuteChanged?.Invoke(this, EventArgs.Empty);
			return;
		}

		MainThread.BeginInvokeOnMainThread(() => CanExecuteChanged?.Invoke(this, EventArgs.Empty));
	}

	public bool CanExecute(object? parameter) => !_isExecuting;

	public async void Execute(object? parameter)
	{
		if (!CanExecute(parameter))
			return;

		try
		{
			_isExecuting = true;
			RaiseCanExecuteChanged();
			await _execute();
		}
		finally
		{
			_isExecuting = false;
			RaiseCanExecuteChanged();
		}
	}
}
