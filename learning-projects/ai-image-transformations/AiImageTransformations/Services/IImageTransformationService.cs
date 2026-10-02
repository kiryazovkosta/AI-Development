namespace AiImageTransformations.Services;

/// <summary>
/// Service for applying image transformations (grayscale, flip, etc.)
/// </summary>
public interface IImageTransformationService
{
    /// <summary>
    /// Applies grayscale transformation to an image using RGB averaging.
    /// </summary>
    /// <param name="sourceFilePath">Path to the source image file</param>
    /// <returns>Stream containing the grayscale PNG image</returns>
    Task<Stream> ApplyGrayscaleAsync(string sourceFilePath);
}
