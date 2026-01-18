# Darkroom - the web-based photo editing app for photographer

## Application: Front and backend
- The application uses `bun` as package manager

```sh
cd application
bun i # to install dependencies
bun run dev # to run development server on localhost:5173
```

## Database
- Locally working with MongoDB image
- Remotely (production), working with MongoDB Atlas

## API Testing

### Upload a Photo (`POST /api/photo/new`)

Upload an image file with optional userId in the request body. If userId is not provided, `PUBLIC_DEMO_USER` will be used as default.

```bash
# Upload a photo (uses PUBLIC_DEMO_USER if userId not provided)
curl -X POST http://localhost:5173/api/photo/new \
  -F "file=@$(pwd)test.jpg" \
  -F "userId=your-username"

# Upload a photo without userId (uses PUBLIC_DEMO_USER)
curl -X POST http://localhost:5173/api/photo/new \
  -F "file=@/path/to/your/image.jpg"
```

### Retrieve a Photo File (`GET /api/photo/[photoId]/file`)

Retrieve the image file (Buffer) for a specific photo by its photoId. The response is the raw image data with Content-Type: image/jpeg.

```bash
# Retrieve photo file/buffer
curl -X GET http://localhost:5173/api/photo/[photoId]/file \
  --output retrieved-photo.jpg
```

### Create a Preset (`POST /api/preset/new`)

Create a new photo editing preset. The request body should contain preset data with optional userId.

```bash
# Create a preset with userId in the body
curl -X POST http://localhost:5173/api/preset/new \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "darthVader",
    "basic": {
      "brightness": 10,
      "contrast": 5,
      "highlight": 0,
      "shadow": 0
    },
    "color": {
      "temperature": 0,
      "tint": 0,
      "vibrance": 0,
      "saturation": 0
    },
    "hsl": {
      "red": { "hue": 0, "saturation": 0, "luminance": 0 },
      "orange": { "hue": 0, "saturation": 0, "luminance": 0 },
      "yellow": { "hue": 0, "saturation": 0, "luminance": 0 },
      "green": { "hue": 0, "saturation": 0, "luminance": 0 },
      "cyan": { "hue": 0, "saturation": 0, "luminance": 0 },
      "blue": { "hue": 0, "saturation": 0, "luminance": 0 },
      "purple": { "hue": 0, "saturation": 0, "luminance": 0 },
      "magenta": { "hue": 0, "saturation": 0, "luminance": 0 }
    },
    "lens_corrections": {
      "distortion": 0,
      "chromatic_aberration": 0,
      "vignetting": 0
    },
    "transform": {
      "rotate": 0,
      "vertical": 0,
      "horizontal": 0,
      "perspective": 0
    }
  }'
```