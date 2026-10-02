using SkiaSharp;

namespace AiImageTransformations.Services;

/// <summary>
/// Implementation of image transformation operations using SkiaSharp.
/// </summary>
public class ImageTransformationService : IImageTransformationService
{
    /// <summary>
    /// Applies grayscale transformation by averaging RGB values for each pixel.
    /// Formula: gray = (R + G + B) / 3
    /// </summary>
    public Task<Stream> ApplyGrayscaleAsync(string sourceFilePath)
    {
        return Task.Run(() =>
        {
            // Load the image from file
            using var inputStream = File.OpenRead(sourceFilePath);
            using var original = SKBitmap.Decode(inputStream);
            
            if (original == null)
            {
                throw new InvalidOperationException("Failed to decode image file.");
            }

            // Create a new bitmap with the same dimensions
            var grayscale = new SKBitmap(original.Width, original.Height);

            // Process each pixel
            for (int y = 0; y < original.Height; y++)
            {
                for (int x = 0; x < original.Width; x++)
                {
                    var pixel = original.GetPixel(x, y);
                    
                    // Calculate average of RGB channels
                    byte gray = (byte)((pixel.Red + pixel.Green + pixel.Blue) / 3);
                    
                    // Set all RGB channels to the average value (preserve alpha)
                    var grayColor = new SKColor(gray, gray, gray, pixel.Alpha);
                    grayscale.SetPixel(x, y, grayColor);
                }
            }

            // Encode to PNG and return stream
            var outputStream = new MemoryStream();
            using (var image = SKImage.FromBitmap(grayscale))
            using (var data = image.Encode(SKEncodedImageFormat.Png, 100))
            {
                data.SaveTo(outputStream);
            }

            outputStream.Position = 0;
            return (Stream)outputStream;
        });
    }
}
