"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const testcafe_browser_tools_1 = require("testcafe-browser-tools");
const crop_1 = require("./crop");
const async_queue_1 = require("../utils/async-queue");
const warning_message_1 = __importDefault(require("../notifications/warning-message"));
const escape_user_agent_1 = __importDefault(require("../utils/escape-user-agent"));
const correct_file_path_1 = __importDefault(require("../utils/correct-file-path"));
const promisified_functions_1 = require("../utils/promisified-functions");
class Capturer {
    constructor(baseScreenshotsPath, testEntry, connection, pathPattern, fullPage, warningLog) {
        this.enabled = !!baseScreenshotsPath;
        this.baseScreenshotsPath = baseScreenshotsPath;
        this.testEntry = testEntry;
        this.provider = connection.provider;
        this.browserId = connection.id;
        this.warningLog = warningLog;
        this.pathPattern = pathPattern;
        this.fullPage = fullPage;
    }
    static _getDimensionWithoutScrollbar(fullDimension, documentDimension, bodyDimension) {
        if (bodyDimension > fullDimension)
            return documentDimension;
        if (documentDimension > fullDimension)
            return bodyDimension;
        return Math.max(documentDimension, bodyDimension);
    }
    static _getCropDimensions(cropDimensions, pageDimensions) {
        if (!cropDimensions || !pageDimensions)
            return null;
        const { dpr } = pageDimensions;
        const { top, left, bottom, right } = cropDimensions;
        return {
            top: Math.round(top * dpr),
            left: Math.round(left * dpr),
            bottom: Math.round(bottom * dpr),
            right: Math.round(right * dpr)
        };
    }
    static _getClientAreaDimensions(pageDimensions) {
        if (!pageDimensions)
            return null;
        const { innerWidth, documentWidth, bodyWidth, innerHeight, documentHeight, bodyHeight, dpr } = pageDimensions;
        return {
            width: Math.floor(Capturer._getDimensionWithoutScrollbar(innerWidth, documentWidth, bodyWidth) * dpr),
            height: Math.floor(Capturer._getDimensionWithoutScrollbar(innerHeight, documentHeight, bodyHeight) * dpr)
        };
    }
    static async _isScreenshotCaptured(screenshotPath) {
        try {
            const stats = await promisified_functions_1.stat(screenshotPath);
            return stats.isFile();
        }
        catch (e) {
            return false;
        }
    }
    _joinWithBaseScreenshotPath(path) {
        return path_1.join(this.baseScreenshotsPath, path);
    }
    _incrementFileIndexes(forError) {
        if (forError)
            this.pathPattern.data.errorFileIndex++;
        else
            this.pathPattern.data.fileIndex++;
    }
    _getCustomScreenshotPath(customPath) {
        const correctedCustomPath = correct_file_path_1.default(customPath);
        return this._joinWithBaseScreenshotPath(correctedCustomPath);
    }
    _getScreenshotPath(forError) {
        const path = this.pathPattern.getPath(forError);
        this._incrementFileIndexes(forError);
        return this._joinWithBaseScreenshotPath(path);
    }
    _getThumbnailPath(screenshotPath) {
        const imageName = path_1.basename(screenshotPath);
        const imageDir = path_1.dirname(screenshotPath);
        return path_1.join(imageDir, 'thumbnails', imageName);
    }
    async _takeScreenshot({ filePath, pageWidth, pageHeight, fullPage = this.fullPage }) {
        await this.provider.takeScreenshot(this.browserId, filePath, pageWidth, pageHeight, fullPage);
    }
    async _capture(forError, { pageDimensions, cropDimensions, markSeed, customPath, fullPage } = {}) {
        if (!this.enabled)
            return null;
        const screenshotPath = customPath ? this._getCustomScreenshotPath(customPath) : this._getScreenshotPath(forError);
        const thumbnailPath = this._getThumbnailPath(screenshotPath);
        if (async_queue_1.isInQueue(screenshotPath))
            this.warningLog.addWarning(warning_message_1.default.screenshotRewritingError, screenshotPath);
        await async_queue_1.addToQueue(screenshotPath, async () => {
            const clientAreaDimensions = Capturer._getClientAreaDimensions(pageDimensions);
            const { width: pageWidth, height: pageHeight } = clientAreaDimensions || {};
            const takeScreenshotOptions = {
                filePath: screenshotPath,
                pageWidth,
                pageHeight,
                fullPage
            };
            await this._takeScreenshot(takeScreenshotOptions);
            if (!await Capturer._isScreenshotCaptured(screenshotPath))
                return;
            const image = await promisified_functions_1.readPngFile(screenshotPath);
            const croppedImage = await crop_1.cropScreenshot(image, {
                markSeed,
                clientAreaDimensions,
                path: screenshotPath,
                cropDimensions: Capturer._getCropDimensions(cropDimensions, pageDimensions)
            });
            if (croppedImage)
                await promisified_functions_1.writePng(screenshotPath, croppedImage);
            await testcafe_browser_tools_1.generateThumbnail(screenshotPath, thumbnailPath);
        });
        const testRunId = this.testEntry.testRuns[this.browserId].id;
        const userAgent = escape_user_agent_1.default(this.pathPattern.data.parsedUserAgent.prettyUserAgent);
        const quarantineAttempt = this.pathPattern.data.quarantineAttempt;
        const takenOnFail = forError;
        const screenshot = {
            testRunId,
            screenshotPath,
            thumbnailPath,
            userAgent,
            quarantineAttempt,
            takenOnFail
        };
        this.testEntry.screenshots.push(screenshot);
        return screenshotPath;
    }
    async captureAction(options) {
        return await this._capture(false, options);
    }
    async captureError(options) {
        return await this._capture(true, options);
    }
}
exports.default = Capturer;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FwdHVyZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvc2NyZWVuc2hvdHMvY2FwdHVyZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwrQkFJYztBQUVkLG1FQUEyRDtBQUMzRCxpQ0FBd0M7QUFDeEMsc0RBQTZEO0FBQzdELHVGQUErRDtBQUMvRCxtRkFBeUQ7QUFDekQsbUZBQXlEO0FBQ3pELDBFQUl3QztBQUd4QyxNQUFxQixRQUFRO0lBQ3pCLFlBQWEsbUJBQW1CLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFVBQVU7UUFDdEYsSUFBSSxDQUFDLE9BQU8sR0FBZSxDQUFDLENBQUMsbUJBQW1CLENBQUM7UUFDakQsSUFBSSxDQUFDLG1CQUFtQixHQUFHLG1CQUFtQixDQUFDO1FBQy9DLElBQUksQ0FBQyxTQUFTLEdBQWEsU0FBUyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxRQUFRLEdBQWMsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxHQUFhLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLFVBQVUsR0FBWSxVQUFVLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBVyxXQUFXLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBYyxRQUFRLENBQUM7SUFDeEMsQ0FBQztJQUVELE1BQU0sQ0FBQyw2QkFBNkIsQ0FBRSxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsYUFBYTtRQUNqRixJQUFJLGFBQWEsR0FBRyxhQUFhO1lBQzdCLE9BQU8saUJBQWlCLENBQUM7UUFFN0IsSUFBSSxpQkFBaUIsR0FBRyxhQUFhO1lBQ2pDLE9BQU8sYUFBYSxDQUFDO1FBRXpCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQsTUFBTSxDQUFDLGtCQUFrQixDQUFFLGNBQWMs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QUFDO1FBRTVDLE9BQU8sY0FBYyxDQUFDO0lBQzFCLENBQUM7SUFFRCxLQUFLLENBQUMsYUFBYSxDQUFFLE9BQU87UUFDeEIsT0FBTyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWSxDQUFFLE9BQU87UUFDdkIsT0FBTyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQzlDLENBQUM7Q0FDSjtBQXJLRCwyQkFxS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIGpvaW4gYXMgam9pblBhdGgsXG4gICAgZGlybmFtZSxcbiAgICBiYXNlbmFtZVxufSBmcm9tICdwYXRoJztcblxuaW1wb3J0IHsgZ2VuZXJhdGVUaHVtYm5haWwgfSBmcm9tICd0ZXN0Y2FmZS1icm93c2VyLXRvb2xzJztcbmltcG9ydCB7IGNyb3BTY3JlZW5zaG90IH0gZnJvbSAnLi9jcm9wJztcbmltcG9ydCB7IGlzSW5RdWV1ZSwgYWRkVG9RdWV1ZSB9IGZyb20gJy4uL3V0aWxzL2FzeW5jLXF1ZXVlJztcbmltcG9ydCBXQVJOSU5HX01FU1NBR0UgZnJvbSAnLi4vbm90aWZpY2F0aW9ucy93YXJuaW5nLW1lc3NhZ2UnO1xuaW1wb3J0IGVzY2FwZVVzZXJBZ2VudCBmcm9tICcuLi91dGlscy9lc2NhcGUtdXNlci1hZ2VudCc7XG5pbXBvcnQgY29ycmVjdEZpbGVQYXRoIGZyb20gJy4uL3V0aWxzL2NvcnJlY3QtZmlsZS1wYXRoJztcbmltcG9ydCB7XG4gICAgcmVhZFBuZ0ZpbGUsXG4gICAgc3RhdCxcbiAgICB3cml0ZVBuZ1xufSBmcm9tICcuLi91dGlscy9wcm9taXNpZmllZC1mdW5jdGlvbnMnO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENhcHR1cmVyIHtcbiAgICBjb25zdHJ1Y3RvciAoYmFzZVNjcmVlbnNob3RzUGF0aCwgdGVzdEVudHJ5LCBjb25uZWN0aW9uLCBwYXRoUGF0dGVybiwgZnVsbFBhZ2UsIHdhcm5pbmdMb2cpIHtcbiAgICAgICAgdGhpcy5lbmFibGVkICAgICAgICAgICAgID0gISFiYXNlU2NyZWVuc2hvdHNQYXRoO1xuICAgICAgICB0aGlzLmJhc2VTY3JlZW5zaG90c1BhdGggPSBiYXNlU2NyZWVuc2hvdHNQYXRoO1xuICAgICAgICB0aGlzLnRlc3RFbnRyeSAgICAgICAgICAgPSB0ZXN0RW50cnk7XG4gICAgICAgIHRoaXMucHJvdmlkZXIgICAgICAgICAgICA9IGNvbm5lY3Rpb24ucHJvdmlkZXI7XG4gICAgICAgIHRoaXMuYnJvd3NlcklkICAgICAgICAgICA9IGNvbm5lY3Rpb24uaWQ7XG4gICAgICAgIHRoaXMud2FybmluZ0xvZyAgICAgICAgICA9IHdhcm5pbmdMb2c7XG4gICAgICAgIHRoaXMucGF0aFBhdHRlcm4gICAgICAgICA9IHBhdGhQYXR0ZXJuO1xuICAgICAgICB0aGlzLmZ1bGxQYWdlICAgICAgICAgICAgPSBmdWxsUGFnZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2dldERpbWVuc2lvbldpdGhvdXRTY3JvbGxiYXIgKGZ1bGxEaW1lbnNpb24sIGRvY3VtZW50RGltZW5zaW9uLCBib2R5RGltZW5zaW9uKSB7XG4gICAgICAgIGlmIChib2R5RGltZW5zaW9uID4gZnVsbERpbWVuc2lvbilcbiAgICAgICAgICAgIHJldHVybiBkb2N1bWVudERpbWVuc2lvbjtcblxuICAgICAgICBpZiAoZG9jdW1lbnREaW1lbnNpb24gPiBmdWxsRGltZW5zaW9uKVxuICAgICAgICAgICAgcmV0dXJuIGJvZHlEaW1lbnNpb247XG5cbiAgICAgICAgcmV0dXJuIE1hdGgubWF4KGRvY3VtZW50RGltZW5zaW9uLCBib2R5RGltZW5zaW9uKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2dldENyb3BEaW1lbnNpb25zIChjcm9wRGltZW5zaW9ucywgcGFnZURpbWVuc2lvbnMpIHtcbiAgICAgICAgaWYgKCFjcm9wRGltZW5zaW9ucyB8fCAhcGFnZURpbWVuc2lvbnMpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCB7IGRwciB9ICAgICAgICAgICAgICAgICAgICAgID0gcGFnZURpbWVuc2lvbnM7XG4gICAgICAgIGNvbnN0IHsgdG9wLCBsZWZ0LCBib3R0b20sIHJpZ2h0IH0gPSBjcm9wRGltZW5zaW9ucztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdG9wOiAgICBNYXRoLnJvdW5kKHRvcCAqIGRwciksXG4gICAgICAgICAgICBsZWZ0OiAgIE1hdGgucm91bmQobGVmdCAqIGRwciksXG4gICAgICAgICAgICBib3R0b206IE1hdGgucm91bmQoYm90dG9tICogZHByKSxcbiAgICAgICAgICAgIHJpZ2h0OiAgTWF0aC5yb3VuZChyaWdodCAqIGRwcilcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX2dldENsaWVudEFyZWFEaW1lbnNpb25zIChwYWdlRGltZW5zaW9ucykge1xuICAgICAgICBpZiAoIXBhZ2VEaW1lbnNpb25zKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3QgeyBpbm5lcldpZHRoLCBkb2N1bWVudFdpZHRoLCBib2R5V2lkdGgsIGlubmVySGVpZ2h0LCBkb2N1bWVudEhlaWdodCwgYm9keUhlaWdodCwgZHByIH0gPSBwYWdlRGltZW5zaW9ucztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2lkdGg6ICBNYXRoLmZsb29yKENhcHR1cmVyLl9nZXREaW1lbnNpb25XaXRob3V0U2Nyb2xsYmFyKGlubmVyV2lkdGgsIGRvY3VtZW50V2lkdGgsIGJvZHlXaWR0aCkgKiBkcHIpLFxuICAgICAgICAgICAgaGVpZ2h0OiBNYXRoLmZsb29yKENhcHR1cmVyLl9nZXREaW1lbnNpb25XaXRob3V0U2Nyb2xsYmFyKGlubmVySGVpZ2h0LCBkb2N1bWVudEhlaWdodCwgYm9keUhlaWdodCkgKiBkcHIpXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIF9pc1NjcmVlbnNob3RDYXB0dXJlZCAoc2NyZWVuc2hvdFBhdGgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRzID0gYXdhaXQgc3RhdChzY3JlZW5zaG90UGF0aCk7XG5cbiAgICAgICAgICAgIHJldHVybiBzdGF0cy5pc0ZpbGUoKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2pvaW5XaXRoQmFzZVNjcmVlbnNob3RQYXRoIChwYXRoKSB7XG4gICAgICAgIHJldHVybiBqb2luUGF0aCh0aGlzLmJhc2VTY3JlZW5zaG90c1BhdGgsIHBhdGgpO1xuICAgIH1cblxuICAgIF9pbmNyZW1lbnRGaWxlSW5kZXhlcyAoZm9yRXJyb3IpIHtcbiAgICAgICAgaWYgKGZvckVycm9yKVxuICAgICAgICAgICAgdGhpcy5wYXRoUGF0dGVybi5kYXRhLmVycm9yRmlsZUluZGV4Kys7XG5cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5wYXRoUGF0dGVybi5kYXRhLmZpbGVJbmRleCsrO1xuICAgIH1cblxuICAgIF9nZXRDdXN0b21TY3JlZW5zaG90UGF0aCAoY3VzdG9tUGF0aCkge1xuICAgICAgICBjb25zdCBjb3JyZWN0ZWRDdXN0b21QYXRoID0gY29ycmVjdEZpbGVQYXRoKGN1c3RvbVBhdGgpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9qb2luV2l0aEJhc2VTY3JlZW5zaG90UGF0aChjb3JyZWN0ZWRDdXN0b21QYXRoKTtcbiAgICB9XG5cbiAgICBfZ2V0U2NyZWVuc2hvdFBhdGggKGZvckVycm9yKSB7XG4gICAgICAgIGNvbnN0IHBhdGggPSB0aGlzLnBhdGhQYXR0ZXJuLmdldFBhdGgoZm9yRXJyb3IpO1xuXG4gICAgICAgIHRoaXMuX2luY3JlbWVudEZpbGVJbmRleGVzKGZvckVycm9yKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fam9pbldpdGhCYXNlU2NyZWVuc2hvdFBhdGgocGF0aCk7XG4gICAgfVxuXG4gICAgX2dldFRodW1ibmFpbFBhdGggKHNjcmVlbnNob3RQYXRoKSB7XG4gICAgICAgIGNvbnN0IGltYWdlTmFtZSA9IGJhc2VuYW1lKHNjcmVlbnNob3RQYXRoKTtcbiAgICAgICAgY29uc3QgaW1hZ2VEaXIgID0gZGlybmFtZShzY3JlZW5zaG90UGF0aCk7XG5cbiAgICAgICAgcmV0dXJuIGpvaW5QYXRoKGltYWdlRGlyLCAndGh1bWJuYWlscycsIGltYWdlTmFtZSk7XG4gICAgfVxuXG4gICAgYXN5bmMgX3Rha2VTY3JlZW5zaG90ICh7IGZpbGVQYXRoLCBwYWdlV2lkdGgsIHBhZ2VIZWlnaHQsIGZ1bGxQYWdlID0gdGhpcy5mdWxsUGFnZSB9KSB7XG4gICAgICAgIGF3YWl0IHRoaXMucHJvdmlkZXIudGFrZVNjcmVlbnNob3QodGhpcy5icm93c2VySWQsIGZpbGVQYXRoLCBwYWdlV2lkdGgsIHBhZ2VIZWlnaHQsIGZ1bGxQYWdlKTtcbiAgICB9XG5cbiAgICBhc3luYyBfY2FwdHVyZSAoZm9yRXJyb3IsIHsgcGFnZURpbWVuc2lvbnMsIGNyb3BEaW1lbnNpb25zLCBtYXJrU2VlZCwgY3VzdG9tUGF0aCwgZnVsbFBhZ2UgfSA9IHt9KSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgY29uc3Qgc2NyZWVuc2hvdFBhdGggPSBjdXN0b21QYXRoID8gdGhpcy5fZ2V0Q3VzdG9tU2NyZWVuc2hvdFBhdGgoY3VzdG9tUGF0aCkgOiB0aGlzLl9nZXRTY3JlZW5zaG90UGF0aChmb3JFcnJvcik7XG4gICAgICAgIGNvbnN0IHRodW1ibmFpbFBhdGggID0gdGhpcy5fZ2V0VGh1bWJuYWlsUGF0aChzY3JlZW5zaG90UGF0aCk7XG5cbiAgICAgICAgaWYgKGlzSW5RdWV1ZShzY3JlZW5zaG90UGF0aCkpXG4gICAgICAgICAgICB0aGlzLndhcm5pbmdMb2cuYWRkV2FybmluZyhXQVJOSU5HX01FU1NBR0Uuc2NyZWVuc2hvdFJld3JpdGluZ0Vycm9yLCBzY3JlZW5zaG90UGF0aCk7XG5cbiAgICAgICAgYXdhaXQgYWRkVG9RdWV1ZShzY3JlZW5zaG90UGF0aCwgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2xpZW50QXJlYURpbWVuc2lvbnMgPSBDYXB0dXJlci5fZ2V0Q2xpZW50QXJlYURpbWVuc2lvbnMocGFnZURpbWVuc2lvbnMpO1xuXG4gICAgICAgICAgICBjb25zdCB7IHdpZHRoOiBwYWdlV2lkdGgsIGhlaWdodDogcGFnZUhlaWdodCB9ID0gY2xpZW50QXJlYURpbWVuc2lvbnMgfHwge307XG5cbiAgICAgICAgICAgIGNvbnN0IHRha2VTY3JlZW5zaG90T3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICBmaWxlUGF0aDogc2NyZWVuc2hvdFBhdGgsXG4gICAgICAgICAgICAgICAgcGFnZVdpZHRoLFxuICAgICAgICAgICAgICAgIHBhZ2VIZWlnaHQsXG4gICAgICAgICAgICAgICAgZnVsbFBhZ2VcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX3Rha2VTY3JlZW5zaG90KHRha2VTY3JlZW5zaG90T3B0aW9ucyk7XG5cbiAgICAgICAgICAgIGlmICghYXdhaXQgQ2FwdHVyZXIuX2lzU2NyZWVuc2hvdENhcHR1cmVkKHNjcmVlbnNob3RQYXRoKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIGNvbnN0IGltYWdlID0gYXdhaXQgcmVhZFBuZ0ZpbGUoc2NyZWVuc2hvdFBhdGgpO1xuXG4gICAgICAgICAgICBjb25zdCBjcm9wcGVkSW1hZ2UgPSBhd2FpdCBjcm9wU2NyZWVuc2hvdChpbWFnZSwge1xuICAgICAgICAgICAgICAgIG1hcmtTZWVkLFxuICAgICAgICAgICAgICAgIGNsaWVudEFyZWFEaW1lbnNpb25zLFxuICAgICAgICAgICAgICAgIHBhdGg6ICAgICAgICAgICBzY3JlZW5zaG90UGF0aCxcbiAgICAgICAgICAgICAgICBjcm9wRGltZW5zaW9uczogQ2FwdHVyZXIuX2dldENyb3BEaW1lbnNpb25zKGNyb3BEaW1lbnNpb25zLCBwYWdlRGltZW5zaW9ucylcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAoY3JvcHBlZEltYWdlKVxuICAgICAgICAgICAgICAgIGF3YWl0IHdyaXRlUG5nKHNjcmVlbnNob3RQYXRoLCBjcm9wcGVkSW1hZ2UpO1xuXG4gICAgICAgICAgICBhd2FpdCBnZW5lcmF0ZVRodW1ibmFpbChzY3JlZW5zaG90UGF0aCwgdGh1bWJuYWlsUGF0aCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHRlc3RSdW5JZCAgICAgICAgID0gdGhpcy50ZXN0RW50cnkudGVzdFJ1bnNbdGhpcy5icm93c2VySWRdLmlkO1xuICAgICAgICBjb25zdCB1c2VyQWdlbnQgICAgICAgICA9IGVzY2FwZVVzZXJBZ2VudCh0aGlzLnBhdGhQYXR0ZXJuLmRhdGEucGFyc2VkVXNlckFnZW50LnByZXR0eVVzZXJBZ2VudCk7XG4gICAgICAgIGNvbnN0IHF1YXJhbnRpbmVBdHRlbXB0ID0gdGhpcy5wYXRoUGF0dGVybi5kYXRhLnF1YXJhbnRpbmVBdHRlbXB0O1xuICAgICAgICBjb25zdCB0YWtlbk9uRmFpbCAgICAgICA9IGZvckVycm9yO1xuXG4gICAgICAgIGNvbnN0IHNjcmVlbnNob3QgPSB7XG4gICAgICAgICAgICB0ZXN0UnVuSWQsXG4gICAgICAgICAgICBzY3JlZW5zaG90UGF0aCxcbiAgICAgICAgICAgIHRodW1ibmFpbFBhdGgsXG4gICAgICAgICAgICB1c2VyQWdlbnQsXG4gICAgICAgICAgICBxdWFyYW50aW5lQXR0ZW1wdCxcbiAgICAgICAgICAgIHRha2VuT25GYWlsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50ZXN0RW50cnkuc2NyZWVuc2hvdHMucHVzaChzY3JlZW5zaG90KTtcblxuICAgICAgICByZXR1cm4gc2NyZWVuc2hvdFBhdGg7XG4gICAgfVxuXG4gICAgYXN5bmMgY2FwdHVyZUFjdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gYXdhaXQgdGhpcy5fY2FwdHVyZShmYWxzZSwgb3B0aW9ucyk7XG4gICAgfVxuXG4gICAgYXN5bmMgY2FwdHVyZUVycm9yIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9jYXB0dXJlKHRydWUsIG9wdGlvbnMpO1xuICAgIH1cbn1cblxuIl19