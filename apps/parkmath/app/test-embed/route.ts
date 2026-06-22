/**
 * /test-embed — local-only test page for verifying the widget iframe embed.
 * Not indexed; will be removed before production deployment.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3099";

export async function GET() {
  const widgetUrl = `${SITE_URL}/widget/drop-off-index`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Widget Embed Test — Host Page</title>
<meta name="robots" content="noindex,nofollow">
<style>
  body{font-family:Georgia,"Times New Roman",serif;background:#f8f6f1;color:#1a1a1a;margin:0;padding:24px}
  .article{max-width:680px;margin:0 auto}
  h1{font-size:22px;margin-bottom:12px;font-weight:700}
  p{line-height:1.65;margin-bottom:14px;font-size:16px}
  .widget-host{margin:24px 0}
</style>
</head>
<body>
<div class="article">
  <h1>UK airport drop-off charges: what you need to know</h1>
  <p>Planning to be dropped off at a UK airport? Make sure you know the cost before you go — charges vary wildly between airports, and some can sting you with an £80+ penalty if you don&apos;t pay.</p>

  <div class="widget-host">
    <!-- Embed snippet a journalist would paste (the final version uses the production URL) -->
    <iframe
      src="${widgetUrl}"
      title="UK airport drop-off charges — ParkMath"
      width="100%"
      height="220"
      style="border:none;border-radius:12px;max-width:640px;display:block"
      loading="lazy"
    ></iframe>
    <script>
    window.addEventListener("message",function(e){
      if(e.data&&e.data.type==="parkmath-embed-height"){
        var f=document.querySelector('iframe[src*="widget"]');
        if(f)f.style.height=e.data.height+"px";
      }
    });
    </script>
  </div>

  <p>The data above is verified directly against each airport&apos;s official page, so you can trust the figures. Click &ldquo;Compare all airports&rdquo; to see the full breakdown including time limits, penalties and free alternatives.</p>
</div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
