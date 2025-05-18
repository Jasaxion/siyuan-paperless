# PaperLess-Ngx Siyuan Note Plugin

[中文](https://github.com/Jasaxion/siyuan-paperless/blob/main/README_zh_CN.md)

## Introduction

[PaperLess](https://docs.paperless-ngx.com/) is an open-source, self-hosted paperless document management platform that helps you efficiently manage all your documents.
This plugin allows you to easily upload resource files from SiYuan Note to your PaperLess server.

## How to Use

1. Download and activate the plugin.

2. Open the plugin settings menu:
   ![alt text](./img/image.png)

3. Enter your PaperLess server address, authentication token, and the file suffixes to be included for upload.

4. Click "Test Connection" to check if the server can be connected successfully.

## Features:

1. Automatically upload documents incrementally to the PaperLess server.
2. Automatically detect already uploaded files to avoid overwriting. Overwriting uploads involve deletion permissions and carry risks. If you need to overwrite or delete documents, it is recommended to manually remove them from the PaperLess document library.
3. Manually upload resource files to the PaperLess server via right-click menu.
4. The PaperLess server automatically processes documents, including metadata indexing, tagging, OCR, and other operations (you need to configure these properly on the PaperLess server side).


If you find this plugin helpful, consider giving it a ⭐️ on GitHub. Thanks!
