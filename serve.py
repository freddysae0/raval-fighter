# Tiny dev server with caching disabled:  python serve.py  ->  http://localhost:8765
import http.server, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
print(f'Raval Fighter -> http://localhost:{port}')
http.server.ThreadingHTTPServer(('', port), H).serve_forever()
