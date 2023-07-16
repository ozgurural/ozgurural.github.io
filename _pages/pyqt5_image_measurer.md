---
permalink: /blog/pyqt5_image_measurer
title: "Image Measurement with PyQt5: A Cardiology Aid"
---

Python's versatility allows it to create tools for a broad spectrum of professional fields. In this blog post, we delve into creating an image measurement tool using PyQt5 - a set of Python bindings for Qt libraries. This tool, tailored for cardiology doctors analyzing EKG (Electrocardiogram) reports, lets users load an image, select two points on the image, and calculate the distance between them.

This application, named "Image Measurer," was developed for Dr. Görkem Şefik Fatihoğlu, aiding in his analysis of EKG reports.

## Project Overview

Our tool enables users to measure distances within an image relative to a real-world scale. For instance, users can load an EKG report, select two points on the image, and stipulate that the distance represents, say, 0.04 seconds or 1 millivolt in real-world terms.

## Code Overview

Our Python script, which leverages PyQt5, contains some key elements that we'll break down here.

```python
class ImageWithMouseControl(QGraphicsView):
    ...

This custom QGraphicsView class allows us to manage and manipulate graphical items. We extend this PyQt5 widget with additional functionalities like drawing points, lines, and managing mouse events.

```python
class MainWindow(QMainWindow):
    ...


MainWindow serves as the main application window and includes our custom QGraphicsView, menu actions (for opening and saving images), and a status bar to display messages.

```python
def main():
    ...

The main function generates a QApplication, an instance of our MainWindow, and commences the application's main loop.

## How to Use the Application
Starting the application, you can open an image file through the 'Open' option in the File menu or by clicking the Open icon on the toolbar.

Once an image is loaded, you can select two points by left-clicking on the image. After selecting the second point, a line gets drawn between the two points, followed by a dialog box asking you to input the real-world distance corresponding to the distance between the two points in the image.

After setting this reference distance, you can continue to select two points at a time. The application will automatically calculate the real-world distance between the two points based on the reference distance.

## Packaging the Application
We can share the application by packaging it into a standalone executable file. This is accomplished using PyInstaller, a Python package that converts Python applications into standalone executables.

Firstly, you can install PyInstaller via pip:

```python
pip install pyinstaller
```

Then, you can create the standalone executable with the command:

```python
pyinstaller --onefile --windowed image_measurer.py
```

The `--onefile` option tells PyInstaller to produce a single executable file, while `--windowed` prevents a console window from appearing when the application runs.

## Conclusion

We have discussed a PyQt5-based image measurement tool specifically designed for cardiology professionals analyzing EKG reports. This blog post has covered the fundamental code elements, application usage, and the packaging of the application for distribution.

The complete source code for the project is [available on GitHub](https://github.com/ozgurural/image-measurer). This tool is designed to assist medical professionals like Dr. Görkem Şefik Fatihoğlu and improve the EKG analysis process.

Please feel free to leave comments or suggestions below or reach out to me directly for further questions or feedback.

This project is licensed under the terms of the MIT license.
