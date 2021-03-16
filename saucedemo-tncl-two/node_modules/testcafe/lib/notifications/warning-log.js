"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const render_template_1 = __importDefault(require("../utils/render-template"));
class WarningLog {
    constructor(globalLog = null) {
        this.globalLog = globalLog;
        this.messages = [];
    }
    addPlainMessage(msg) {
        // NOTE: avoid duplicates
        if (this.messages.indexOf(msg) < 0)
            this.messages.push(msg);
    }
    addWarning() {
        const msg = render_template_1.default.apply(null, arguments);
        this.addPlainMessage(msg);
        if (this.globalLog)
            this.globalLog.addPlainMessage(msg);
    }
    clear() {
        this.messages = [];
    }
    copyTo(warningLog) {
        this.messages.forEach(msg => warningLog.addWarning(msg));
    }
}
exports.default = WarningLog;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2FybmluZy1sb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbm90aWZpY2F0aW9ucy93YXJuaW5nLWxvZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLCtFQUFzRDtBQUV0RCxNQUFxQixVQUFVO0lBQzNCLFlBQWEsU0FBUyxHQUFHLElBQUk7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7UUFDM0IsSUFBSSxDQUFDLFFBQVEsR0FBSSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQUVELGVBQWUsQ0FBRSxHQUFHO1FBQ2hCLHlCQUF5QjtRQUN6QixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUM7WUFDOUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVELFVBQVU7UUFDTixNQUFNLEdBQUcsR0FBRyx5QkFBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUUxQixJQUFJLElBQUksQ0FBQyxTQUFTO1lBQ2QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDNUMsQ0FBQztJQUVELEtBQUs7UUFDRCxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUN2QixDQUFDO0lBRUQsTUFBTSxDQUFFLFVBQVU7UUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0NBQ0o7QUE1QkQsNkJBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHJlbmRlclRlbXBsYXRlIGZyb20gJy4uL3V0aWxzL3JlbmRlci10ZW1wbGF0ZSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdhcm5pbmdMb2cge1xuICAgIGNvbnN0cnVjdG9yIChnbG9iYWxMb2cgPSBudWxsKSB7XG4gICAgICAgIHRoaXMuZ2xvYmFsTG9nID0gZ2xvYmFsTG9nO1xuICAgICAgICB0aGlzLm1lc3NhZ2VzICA9IFtdO1xuICAgIH1cblxuICAgIGFkZFBsYWluTWVzc2FnZSAobXNnKSB7XG4gICAgICAgIC8vIE5PVEU6IGF2b2lkIGR1cGxpY2F0ZXNcbiAgICAgICAgaWYgKHRoaXMubWVzc2FnZXMuaW5kZXhPZihtc2cpIDwgMClcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZXMucHVzaChtc2cpO1xuICAgIH1cblxuICAgIGFkZFdhcm5pbmcgKCkge1xuICAgICAgICBjb25zdCBtc2cgPSByZW5kZXJUZW1wbGF0ZS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuXG4gICAgICAgIHRoaXMuYWRkUGxhaW5NZXNzYWdlKG1zZyk7XG5cbiAgICAgICAgaWYgKHRoaXMuZ2xvYmFsTG9nKVxuICAgICAgICAgICAgdGhpcy5nbG9iYWxMb2cuYWRkUGxhaW5NZXNzYWdlKG1zZyk7XG4gICAgfVxuXG4gICAgY2xlYXIgKCkge1xuICAgICAgICB0aGlzLm1lc3NhZ2VzID0gW107XG4gICAgfVxuXG4gICAgY29weVRvICh3YXJuaW5nTG9nKSB7XG4gICAgICAgIHRoaXMubWVzc2FnZXMuZm9yRWFjaChtc2cgPT4gd2FybmluZ0xvZy5hZGRXYXJuaW5nKG1zZykpO1xuICAgIH1cbn1cbiJdfQ==