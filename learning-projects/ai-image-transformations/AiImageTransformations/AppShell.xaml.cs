using Microsoft.Extensions.DependencyInjection;

namespace AiImageTransformations;

public partial class AppShell : Shell
{
	public AppShell(IServiceProvider services)
	{
		InitializeComponent();

		Items.Add(new ShellContent
		{
			Title = "Home",
			Route = "MainPage",
			ContentTemplate = new DataTemplate(() => services.GetRequiredService<MainPage>()),
		});
	}
}
