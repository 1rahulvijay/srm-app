import sys
from PyQt5.QtWidgets import QApplication
from PyQt5.QtWebEngineWidgets import QWebEnginePage
from PyQt5.QtCore import QUrl, QTimer


class PDFExporter:
    def __init__(self, urls, output_file="InsightDash_Dashboard.pdf"):
        self.app = QApplication(sys.argv)
        self.urls = urls
        self.output_file = output_file
        self.current = 0
        self.pdf_data = []
        self.page = QWebEnginePage()
        self.page.loadFinished.connect(self.handle_load_finished)

    def start(self):
        self.load_next()

    def load_next(self):
        if self.current < len(self.urls):
            print(f"Loading: {self.urls[self.current][1]}")
            self.page.load(QUrl(self.urls[self.current][0]))
        else:
            print("PDF export complete.")
            self.app.quit()

    def handle_load_finished(self, ok):
        if not ok:
            print(f"Failed to load {self.urls[self.current][0]}")
            self.current += 1
            self.load_next()
            return

        # Wait a bit for JS-rendered content
        QTimer.singleShot(3000, self.export_pdf)

    def export_pdf(self):
        filename = f"page_{self.current}.pdf"
        print(f"Exporting to {filename}")
        self.page.printToPdf(filename)
        self.current += 1
        QTimer.singleShot(1000, self.load_next)


if __name__ == "__main__":
    urls = [
        ("http://127.0.0.1:5000/", "Home Dashboard"),
        ("http://127.0.0.1:5000/productivity", "Productivity Dashboard"),
        ("http://127.0.0.1:5000/fte", "FTE Dashboard"),
        ("http://127.0.0.1:5000/sankey", "Sankey Dashboard"),
    ]
    exporter = PDFExporter(urls)
    exporter.start()
    sys.exit(exporter.app.exec_())
