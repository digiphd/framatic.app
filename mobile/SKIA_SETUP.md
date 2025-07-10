# React Native Skia Setup Instructions

## Current Status
✅ React Native Skia is installed  
✅ Plugins are configured in app.json  
✅ Web support is set up  
⚠️ Need to enable Skia renderer in components  

## To Enable Skia Rendering:

### Step 1: Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart with cleared cache
npx expo start --clear
```

### Step 2: Re-enable Skia Components
In `src/components/screens/MetadataEditScreen.tsx`:

1. **Uncomment imports:**
```typescript
import { SkiaSlideRenderer, SkiaSlideRendererRef } from '../ui/SkiaSlideRenderer';
import { ConsistencyDebugger } from '../debug/ConsistencyDebugger';
```

2. **Re-enable Skia state:**
```typescript
const [useSkiaRenderer, setUseSkiaRenderer] = useState(true); // Enable Skia
const skiaSlideRenderersRef = useRef<{ [key: string]: SkiaSlideRendererRef }>({});
const visibleSkiaSlideRendererRef = useRef<SkiaSlideRendererRef | null>(null);
```

3. **Uncomment Skia renderers in JSX:**
- Uncomment the conditional Skia rendering in the export overlay
- Uncomment the hidden Skia renderers
- Uncomment the ConsistencyDebugger

### Step 3: Test Skia Rendering
1. Open the app
2. Go to a slideshow's metadata screen
3. Tap the debug button (🐛) to test consistency
4. Try "Save with Text Overlays (Skia)" export option

## Benefits of Skia Implementation:
- **Pixel-perfect consistency** between preview and export
- **Same rendering engine** on client and server
- **Better performance** for complex graphics
- **Built-in debugging tools** for consistency validation

## Components Created:
1. **SkiaSlideRenderer** - Skia-based slide preview component
2. **Server-side Skia endpoint** - `/api/slideshow/render-skia`
3. **ConsistencyDebugger** - Visual comparison and testing tools
4. **ConsistencyTester** - Automated test suite for validation

## Troubleshooting:
- If you get "react-native-reanimated is not installed" error, restart Metro bundler
- If Skia components don't load, check that plugins are properly configured in app.json
- For iOS, you may need to run `npx pod-install` after enabling Skia

## Export Options Available:
1. **Save Images Only** - Original images without text overlays
2. **Save with Text Overlays (Skia)** - Pixel-perfect rendering with Skia
3. **Save with Text Overlays (Canvas)** - Fallback Canvas rendering
4. **Share Content** - Share slideshow content as text