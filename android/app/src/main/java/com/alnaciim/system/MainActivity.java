package com.alnaciim.system;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
  }

  @Override
  public void onResume() {
    super.onResume();
    // Force fresh load from server every time app is opened
    WebView webView = getBridge().getWebView();
    if (webView != null) {
      WebSettings settings = webView.getSettings();
      // Always check server for fresh content - never serve stale cache
      settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
      settings.setDomStorageEnabled(true);
      // Reload to pick up any Vercel deployment updates
      webView.reload();
    }
  }
}
