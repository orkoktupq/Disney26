#!/bin/bash
# Script para empaquetar de forma nativa la app Disney & Universal Itinerary 2026 en macOS
# Compila un binario Swift nativo que inicializa un WKWebView apuntando al archivo local

WORKSPACE_DIR="/Users/juanmanuellopez/Disney 26"
APP_DIR="$WORKSPACE_DIR/Disney2026.app"
PNG_ICON="$WORKSPACE_DIR/processed_app_icon.png"

echo "===> 1. Creando estructura de carpetas de la aplicación macOS..."
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

echo "===> 2. Generando Info.plist..."
cat <<EOF > "$APP_DIR/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>es</string>
    <key>CFBundleDisplayName</key>
    <string>Disney 2026</string>
    <key>CFBundleExecutable</key>
    <string>Disney2026</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.disney2026.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Disney 2026</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleSignature</key>
    <string>????</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.10</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
EOF

echo "===> 3. Generando código fuente temporal en Swift..."
cat <<'EOF' > "$WORKSPACE_DIR/main_temp.swift"
import Cocoa
import WebKit

class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Crear la ventana principal del atajo macOS
        let styleMask: NSWindow.StyleMask = [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView]
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1100, height: 800),
            styleMask: styleMask,
            backing: .buffered,
            defer: false
        )
        
        window.title = "Disney & Universal 2026"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.isMovableByWindowBackground = true
        window.delegate = self
        
        // Recordar posición y tamaño de la ventana
        if !window.setFrameUsingName("Disney2026MainWindow") {
            window.center()
        }
        window.setFrameAutosaveName("Disney2026MainWindow")
        
        // Limpiar caché al arrancar para evitar recursos bloqueados
        let websiteDataTypes = NSSet(array: [WKWebsiteDataTypeDiskCache, WKWebsiteDataTypeMemoryCache]) as! Set<String>
        let dateFrom = Date(timeIntervalSince1970: 0)
        WKWebsiteDataStore.default().removeData(ofTypes: websiteDataTypes, modifiedSince: dateFrom) { }

        // Configuración de WKWebView
        let configuration = WKWebViewConfiguration()
        configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        if configuration.responds(to: NSSelectorFromString("allowUniversalAccessFromFileURLs")) {
            configuration.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        }
        
        webView = WKWebView(frame: .zero, configuration: configuration)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        if let contentView = window.contentView {
            contentView.addSubview(webView)
            
            // Ajustar WKWebView respetando el espacio del notch/barra superior
            NSLayoutConstraint.activate([
                webView.topAnchor.constraint(equalTo: contentView.safeAreaLayoutGuide.topAnchor),
                webView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
                webView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
                webView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor)
            ])
        }
        
        // Cargar archivo HTML local
        let indexURL = URL(fileURLWithPath: "/Users/juanmanuellopez/Disney 26/index.html")
        let folderURL = URL(fileURLWithPath: "/Users/juanmanuellopez/Disney 26")
        webView.loadFileURL(indexURL, allowingReadAccessTo: folderURL)
        
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
    
    func windowWillClose(_ notification: Notification) {
        NSApp.terminate(nil)
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    // Alertas JS adaptadas nativas
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = "Disney & Universal"
        alert.informativeText = message
        alert.alertStyle = .informational
        alert.addButton(withTitle: "Aceptar")
        alert.runModal()
        completionHandler()
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "Confirmar"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "Aceptar")
        alert.addButton(withTitle: "Cancelar")
        let response = alert.runModal()
        completionHandler(response == .alertFirstButtonReturn)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
EOF

echo "===> 4. Compilando aplicación nativa de Mac mediante Swift compiler..."
SDK_PATH=$(xcrun --show-sdk-path)
swiftc -O -sdk "$SDK_PATH" -target arm64-apple-macosx11.3 "$WORKSPACE_DIR/main_temp.swift" -o "$APP_DIR/Contents/MacOS/Disney2026"
rm -f "$WORKSPACE_DIR/main_temp.swift"

echo "===> 5. Creando icono .icns para macOS a partir del PNG generado..."
ICONSET_DIR="$WORKSPACE_DIR/AppIcon.iconset"
mkdir -p "$ICONSET_DIR"

sips -s format png -z 16 16     "$PNG_ICON" --out "$ICONSET_DIR/icon_16x16.png" &>/dev/null
sips -s format png -z 32 32     "$PNG_ICON" --out "$ICONSET_DIR/icon_16x16@2x.png" &>/dev/null
sips -s format png -z 32 32     "$PNG_ICON" --out "$ICONSET_DIR/icon_32x32.png" &>/dev/null
sips -s format png -z 64 64     "$PNG_ICON" --out "$ICONSET_DIR/icon_32x32@2x.png" &>/dev/null
sips -s format png -z 128 128   "$PNG_ICON" --out "$ICONSET_DIR/icon_128x128.png" &>/dev/null
sips -s format png -z 256 256   "$PNG_ICON" --out "$ICONSET_DIR/icon_128x128@2x.png" &>/dev/null
sips -s format png -z 256 256   "$PNG_ICON" --out "$ICONSET_DIR/icon_256x256.png" &>/dev/null
sips -s format png -z 512 512   "$PNG_ICON" --out "$ICONSET_DIR/icon_256x256@2x.png" &>/dev/null
sips -s format png -z 512 512   "$PNG_ICON" --out "$ICONSET_DIR/icon_512x512.png" &>/dev/null
sips -s format png -z 1024 1024 "$PNG_ICON" --out "$ICONSET_DIR/icon_512x512@2x.png" &>/dev/null

iconutil -c icns "$ICONSET_DIR" -o "$APP_DIR/Contents/Resources/AppIcon.icns"
rm -rf "$ICONSET_DIR"

# Registrar la aplicación en Launch Services de macOS
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -f "$APP_DIR"

echo "===> 6. La aplicación Disney2026.app ha sido empaquetada con éxito en: $APP_DIR"
echo "¡Puedes moverla a tu carpeta de /Applications y arrastrarla a tu Dock de macOS!"
