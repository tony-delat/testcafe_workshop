"use strict";
// -------------------------------------------------------------
// WARNING: this file is used by both the client and the server.
// Do not use any browser or node-specific API!
// -------------------------------------------------------------
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssertionOptions = exports.ResizeToFitDeviceOptions = exports.DragToElementOptions = exports.TypeOptions = exports.MoveOptions = exports.ClickOptions = exports.MouseOptions = exports.ElementScreenshotOptions = exports.ScrollOptions = exports.OffsetOptions = exports.ActionOptions = exports.speedOption = exports.booleanOption = exports.positiveIntegerOption = exports.integerOption = void 0;
const assignable_1 = __importDefault(require("../../utils/assignable"));
const factories_1 = require("./validations/factories");
const errors_1 = require("../../shared/errors");
exports.integerOption = factories_1.createIntegerValidator(errors_1.ActionIntegerOptionError);
exports.positiveIntegerOption = factories_1.createPositiveIntegerValidator(errors_1.ActionPositiveIntegerOptionError);
exports.booleanOption = factories_1.createBooleanValidator(errors_1.ActionBooleanOptionError);
exports.speedOption = factories_1.createSpeedValidator(errors_1.ActionSpeedOptionError);
// Actions
class ActionOptions extends assignable_1.default {
    constructor(obj, validate) {
        super();
        this.speed = null;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return [
            { name: 'speed', type: exports.speedOption }
        ];
    }
}
exports.ActionOptions = ActionOptions;
// Offset
class OffsetOptions extends ActionOptions {
    constructor(obj, validate) {
        super();
        this.offsetX = null;
        this.offsetY = null;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'offsetX', type: exports.integerOption },
            { name: 'offsetY', type: exports.integerOption }
        ]);
    }
}
exports.OffsetOptions = OffsetOptions;
class ScrollOptions extends OffsetOptions {
    constructor(obj, validate) {
        super();
        this.scrollToCenter = false;
        this.skipParentFrames = false;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'scrollToCenter', type: exports.booleanOption },
            { name: 'skipParentFrames', type: exports.booleanOption }
        ]);
    }
}
exports.ScrollOptions = ScrollOptions;
// Element Screenshot
class ElementScreenshotOptions extends ActionOptions {
    constructor(obj, validate) {
        super();
        this.scrollTargetX = null;
        this.scrollTargetY = null;
        this.includeMargins = false;
        this.includeBorders = true;
        this.includePaddings = true;
        this.crop = {
            left: null,
            right: null,
            top: null,
            bottom: null
        };
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'scrollTargetX', type: exports.integerOption },
            { name: 'scrollTargetY', type: exports.integerOption },
            { name: 'crop.left', type: exports.integerOption },
            { name: 'crop.right', type: exports.integerOption },
            { name: 'crop.top', type: exports.integerOption },
            { name: 'crop.bottom', type: exports.integerOption },
            { name: 'includeMargins', type: exports.booleanOption },
            { name: 'includeBorders', type: exports.booleanOption },
            { name: 'includePaddings', type: exports.booleanOption }
        ]);
    }
}
exports.ElementScreenshotOptions = ElementScreenshotOptions;
// Mouse
class MouseOptions extends OffsetOptions {
    constructor(obj, validate) {
        super();
        this.modifiers = {
            ctrl: false,
            alt: false,
            shift: false,
            meta: false
        };
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'modifiers.ctrl', type: exports.booleanOption },
            { name: 'modifiers.alt', type: exports.booleanOption },
            { name: 'modifiers.shift', type: exports.booleanOption },
            { name: 'modifiers.meta', type: exports.booleanOption }
        ]);
    }
}
exports.MouseOptions = MouseOptions;
// Click
class ClickOptions extends MouseOptions {
    constructor(obj, validate) {
        super();
        this.caretPos = null;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'caretPos', type: exports.positiveIntegerOption }
        ]);
    }
}
exports.ClickOptions = ClickOptions;
// Move
class MoveOptions extends MouseOptions {
    constructor(obj, validate) {
        super();
        this.speed = null;
        this.minMovingTime = null;
        this.holdLeftButton = false;
        this.skipScrolling = false;
        this.skipDefaultDragBehavior = false;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'speed' },
            { name: 'minMovingTime' },
            { name: 'holdLeftButton' },
            { name: 'skipScrolling', type: exports.booleanOption },
            { name: 'skipDefaultDragBehavior', type: exports.booleanOption }
        ]);
    }
}
exports.MoveOptions = MoveOptions;
// Type
class TypeOptions extends ClickOptions {
    constructor(obj, validate) {
        super();
        this.replace = false;
        this.paste = false;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'replace', type: exports.booleanOption },
            { name: 'paste', type: exports.booleanOption }
        ]);
    }
}
exports.TypeOptions = TypeOptions;
// DragToElement
class DragToElementOptions extends MouseOptions {
    constructor(obj, validate) {
        super(obj, validate);
        this.destinationOffsetX = null;
        this.destinationOffsetY = null;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return super._getAssignableProperties().concat([
            { name: 'destinationOffsetX', type: exports.integerOption },
            { name: 'destinationOffsetY', type: exports.integerOption }
        ]);
    }
}
exports.DragToElementOptions = DragToElementOptions;
//ResizeToFitDevice
class ResizeToFitDeviceOptions extends assignable_1.default {
    constructor(obj, validate) {
        super();
        this.portraitOrientation = false;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return [
            { name: 'portraitOrientation', type: exports.booleanOption }
        ];
    }
}
exports.ResizeToFitDeviceOptions = ResizeToFitDeviceOptions;
//Assertion
class AssertionOptions extends assignable_1.default {
    constructor(obj, validate) {
        super();
        this.timeout = void 0;
        this.allowUnawaitedPromise = false;
        this._assignFrom(obj, validate);
    }
    _getAssignableProperties() {
        return [
            { name: 'timeout', type: exports.positiveIntegerOption },
            { name: 'allowUnawaitedPromise', type: exports.booleanOption }
        ];
    }
}
exports.AssertionOptions = AssertionOptions;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXJ1bi9jb21tYW5kcy9vcHRpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxnRUFBZ0U7QUFDaEUsZ0VBQWdFO0FBQ2hFLCtDQUErQztBQUMvQyxnRUFBZ0U7Ozs7OztBQUVoRSx3RUFBZ0Q7QUFDaEQsdURBS2lDO0FBQ2pDLGdEQUs2QjtBQUVoQixRQUFBLGFBQWEsR0FBVyxrQ0FBc0IsQ0FBQyxpQ0FBd0IsQ0FBQyxDQUFDO0FBQ3pFLFFBQUEscUJBQXFCLEdBQUcsMENBQThCLENBQUMseUNBQWdDLENBQUMsQ0FBQztBQUN6RixRQUFBLGFBQWEsR0FBVyxrQ0FBc0IsQ0FBQyxpQ0FBd0IsQ0FBQyxDQUFDO0FBQ3pFLFFBQUEsV0FBVyxHQUFhLGdDQUFvQixDQUFDLCtCQUFzQixDQUFDLENBQUM7QUFHbEYsVUFBVTtBQUNWLE1BQWEsYUFBYyxTQUFRLG9CQUFVO0lBQ3pDLFlBQWEsR0FBRyxFQUFFLFFBQVE7UUFDdEIsS0FBSyxFQUFFLENBQUM7UUFFUixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUVsQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQsd0JBQXdCO1FBQ3BCLE9BQU87WUFDSCxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLG1CQUFXLEVBQUU7U0FDdkMsQ0FBQztJQUNOLENBQUM7Q0FDSjtBQWRELHNDQWNDO0FBRUQsU0FBUztBQUNULE1BQWEsYUFBYyxTQUFRLGFBQWE7SUFDNUMsWUFBYSxHQUFHLEVBQUUsUUFBUTtRQUN0QixLQUFLLEVBQUUsQ0FBQztRQUVSLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBRXBCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FB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QyxPQUFPLEdBQWlCLEtBQUssQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxLQUFLLENBQUM7UUFFbkMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELHdCQUF3QjtRQUNwQixPQUFPO1lBQ0gsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSw2QkFBcUIsRUFBRTtZQUNoRCxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxJQUFJLEVBQUUscUJBQWEsRUFBRTtTQUN6RCxDQUFDO0lBQ04sQ0FBQztDQUNKO0FBaEJELDRDQWdCQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFdBUk5JTkc6IHRoaXMgZmlsZSBpcyB1c2VkIGJ5IGJvdGggdGhlIGNsaWVudCBhbmQgdGhlIHNlcnZlci5cbi8vIERvIG5vdCB1c2UgYW55IGJyb3dzZXIgb3Igbm9kZS1zcGVjaWZpYyBBUEkhXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBBc3NpZ25hYmxlIGZyb20gJy4uLy4uL3V0aWxzL2Fzc2lnbmFibGUnO1xuaW1wb3J0IHtcbiAgICBjcmVhdGVCb29sZWFuVmFsaWRhdG9yLFxuICAgIGNyZWF0ZUludGVnZXJWYWxpZGF0b3IsXG4gICAgY3JlYXRlUG9zaXRpdmVJbnRlZ2VyVmFsaWRhdG9yLFxuICAgIGNyZWF0ZVNwZWVkVmFsaWRhdG9yXG59IGZyb20gJy4vdmFsaWRhdGlvbnMvZmFjdG9yaWVzJztcbmltcG9ydCB7XG4gICAgQWN0aW9uSW50ZWdlck9wdGlvbkVycm9yLFxuICAgIEFjdGlvblBvc2l0aXZlSW50ZWdlck9wdGlvbkVycm9yLFxuICAgIEFjdGlvbkJvb2xlYW5PcHRpb25FcnJvcixcbiAgICBBY3Rpb25TcGVlZE9wdGlvbkVycm9yXG59IGZyb20gJy4uLy4uL3NoYXJlZC9lcnJvcnMnO1xuXG5leHBvcnQgY29uc3QgaW50ZWdlck9wdGlvbiAgICAgICAgID0gY3JlYXRlSW50ZWdlclZhbGlkYXRvcihBY3Rpb25JbnRlZ2VyT3B0aW9uRXJyb3IpO1xuZXhwb3J0IGNvbnN0IHBvc2l0aXZlSW50ZWdlck9wdGlvbiA9IGNyZWF0ZVBvc2l0aXZlSW50ZWdlclZhbGlkYXRvcihBY3Rpb25Qb3NpdGl2ZUludGVnZXJPcHRpb25FcnJvcik7XG5leHBvcnQgY29uc3QgYm9vbGVhbk9wdGlvbiAgICAgICAgID0gY3JlYXRlQm9vbGVhblZhbGlkYXRvcihBY3Rpb25Cb29sZWFuT3B0aW9uRXJyb3IpO1xuZXhwb3J0IGNvbnN0IHNwZWVkT3B0aW9uICAgICAgICAgICA9IGNyZWF0ZVNwZWVkVmFsaWRhdG9yKEFjdGlvblNwZWVkT3B0aW9uRXJyb3IpO1xuXG5cbi8vIEFjdGlvbnNcbmV4cG9ydCBjbGFzcyBBY3Rpb25PcHRpb25zIGV4dGVuZHMgQXNzaWduYWJsZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdmFsaWRhdGUpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnNwZWVkID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9hc3NpZ25Gcm9tKG9iaiwgdmFsaWRhdGUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzcGVlZCcsIHR5cGU6IHNwZWVkT3B0aW9uIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG5cbi8vIE9mZnNldFxuZXhwb3J0IGNsYXNzIE9mZnNldE9wdGlvbnMgZXh0ZW5kcyBBY3Rpb25PcHRpb25zIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB2YWxpZGF0ZSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMub2Zmc2V0WCA9IG51bGw7XG4gICAgICAgIHRoaXMub2Zmc2V0WSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5fYXNzaWduRnJvbShvYmosIHZhbGlkYXRlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIuX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzKCkuY29uY2F0KFtcbiAgICAgICAgICAgIHsgbmFtZTogJ29mZnNldFgnLCB0eXBlOiBpbnRlZ2VyT3B0aW9uIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvZmZzZXRZJywgdHlwZTogaW50ZWdlck9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjcm9sbE9wdGlvbnMgZXh0ZW5kcyBPZmZzZXRPcHRpb25zIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB2YWxpZGF0ZSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsVG9DZW50ZXIgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNraXBQYXJlbnRGcmFtZXMgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9hc3NpZ25Gcm9tKG9iaiwgdmFsaWRhdGUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5fZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMoKS5jb25jYXQoW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2Nyb2xsVG9DZW50ZXInLCB0eXBlOiBib29sZWFuT3B0aW9uIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdza2lwUGFyZW50RnJhbWVzJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuLy8gRWxlbWVudCBTY3JlZW5zaG90XG5leHBvcnQgY2xhc3MgRWxlbWVudFNjcmVlbnNob3RPcHRpb25zIGV4dGVuZHMgQWN0aW9uT3B0aW9ucyB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdmFsaWRhdGUpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnNjcm9sbFRhcmdldFggICA9IG51bGw7XG4gICAgICAgIHRoaXMuc2Nyb2xsVGFyZ2V0WSAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbmNsdWRlTWFyZ2lucyAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pbmNsdWRlQm9yZGVycyAgPSB0cnVlO1xuICAgICAgICB0aGlzLmluY2x1ZGVQYWRkaW5ncyA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jcm9wID0ge1xuICAgICAgICAgICAgbGVmdDogICBudWxsLFxuICAgICAgICAgICAgcmlnaHQ6ICBudWxsLFxuICAgICAgICAgICAgdG9wOiAgICBudWxsLFxuICAgICAgICAgICAgYm90dG9tOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fYXNzaWduRnJvbShvYmosIHZhbGlkYXRlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIuX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzKCkuY29uY2F0KFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3Njcm9sbFRhcmdldFgnLCB0eXBlOiBpbnRlZ2VyT3B0aW9uIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdzY3JvbGxUYXJnZXRZJywgdHlwZTogaW50ZWdlck9wdGlvbiB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnY3JvcC5sZWZ0JywgdHlwZTogaW50ZWdlck9wdGlvbiB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnY3JvcC5yaWdodCcsIHR5cGU6IGludGVnZXJPcHRpb24gfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2Nyb3AudG9wJywgdHlwZTogaW50ZWdlck9wdGlvbiB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnY3JvcC5ib3R0b20nLCB0eXBlOiBpbnRlZ2VyT3B0aW9uIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdpbmNsdWRlTWFyZ2lucycsIHR5cGU6IGJvb2xlYW5PcHRpb24gfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2luY2x1ZGVCb3JkZXJzJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnaW5jbHVkZVBhZGRpbmdzJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuLy8gTW91c2VcbmV4cG9ydCBjbGFzcyBNb3VzZU9wdGlvbnMgZXh0ZW5kcyBPZmZzZXRPcHRpb25zIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB2YWxpZGF0ZSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMubW9kaWZpZXJzID0ge1xuICAgICAgICAgICAgY3RybDogIGZhbHNlLFxuICAgICAgICAgICAgYWx0OiAgIGZhbHNlLFxuICAgICAgICAgICAgc2hpZnQ6IGZhbHNlLFxuICAgICAgICAgICAgbWV0YTogIGZhbHNlXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fYXNzaWduRnJvbShvYmosIHZhbGlkYXRlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIuX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzKCkuY29uY2F0KFtcbiAgICAgICAgICAgIHsgbmFtZTogJ21vZGlmaWVycy5jdHJsJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbW9kaWZpZXJzLmFsdCcsIHR5cGU6IGJvb2xlYW5PcHRpb24gfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vZGlmaWVycy5zaGlmdCcsIHR5cGU6IGJvb2xlYW5PcHRpb24gfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ21vZGlmaWVycy5tZXRhJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuXG4vLyBDbGlja1xuZXhwb3J0IGNsYXNzIENsaWNrT3B0aW9ucyBleHRlbmRzIE1vdXNlT3B0aW9ucyB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdmFsaWRhdGUpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLmNhcmV0UG9zID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9hc3NpZ25Gcm9tKG9iaiwgdmFsaWRhdGUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5fZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMoKS5jb25jYXQoW1xuICAgICAgICAgICAgeyBuYW1lOiAnY2FyZXRQb3MnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJPcHRpb24gfVxuICAgICAgICBdKTtcbiAgICB9XG59XG5cbi8vIE1vdmVcbmV4cG9ydCBjbGFzcyBNb3ZlT3B0aW9ucyBleHRlbmRzIE1vdXNlT3B0aW9ucyB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdmFsaWRhdGUpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnNwZWVkICAgICAgICAgICAgICAgICAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5taW5Nb3ZpbmdUaW1lICAgICAgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMuaG9sZExlZnRCdXR0b24gICAgICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5za2lwU2Nyb2xsaW5nICAgICAgICAgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLnNraXBEZWZhdWx0RHJhZ0JlaGF2aW9yID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fYXNzaWduRnJvbShvYmosIHZhbGlkYXRlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gc3VwZXIuX2dldEFzc2lnbmFibGVQcm9wZXJ0aWVzKCkuY29uY2F0KFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NwZWVkJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbWluTW92aW5nVGltZScgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2hvbGRMZWZ0QnV0dG9uJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc2tpcFNjcm9sbGluZycsIHR5cGU6IGJvb2xlYW5PcHRpb24gfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3NraXBEZWZhdWx0RHJhZ0JlaGF2aW9yJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuLy8gVHlwZVxuZXhwb3J0IGNsYXNzIFR5cGVPcHRpb25zIGV4dGVuZHMgQ2xpY2tPcHRpb25zIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB2YWxpZGF0ZSkge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMucmVwbGFjZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLnBhc3RlICAgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9hc3NpZ25Gcm9tKG9iaiwgdmFsaWRhdGUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5fZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMoKS5jb25jYXQoW1xuICAgICAgICAgICAgeyBuYW1lOiAncmVwbGFjZScsIHR5cGU6IGJvb2xlYW5PcHRpb24gfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3Bhc3RlJywgdHlwZTogYm9vbGVhbk9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuLy8gRHJhZ1RvRWxlbWVudFxuZXhwb3J0IGNsYXNzIERyYWdUb0VsZW1lbnRPcHRpb25zIGV4dGVuZHMgTW91c2VPcHRpb25zIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB2YWxpZGF0ZSkge1xuICAgICAgICBzdXBlcihvYmosIHZhbGlkYXRlKTtcblxuICAgICAgICB0aGlzLmRlc3RpbmF0aW9uT2Zmc2V0WCA9IG51bGw7XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25PZmZzZXRZID0gbnVsbDtcblxuICAgICAgICB0aGlzLl9hc3NpZ25Gcm9tKG9iaiwgdmFsaWRhdGUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBzdXBlci5fZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMoKS5jb25jYXQoW1xuICAgICAgICAgICAgeyBuYW1lOiAnZGVzdGluYXRpb25PZmZzZXRYJywgdHlwZTogaW50ZWdlck9wdGlvbiB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZGVzdGluYXRpb25PZmZzZXRZJywgdHlwZTogaW50ZWdlck9wdGlvbiB9XG4gICAgICAgIF0pO1xuICAgIH1cbn1cblxuLy9SZXNpemVUb0ZpdERldmljZVxuZXhwb3J0IGNsYXNzIFJlc2l6ZVRvRml0RGV2aWNlT3B0aW9ucyBleHRlbmRzIEFzc2lnbmFibGUge1xuICAgIGNvbnN0cnVjdG9yIChvYmosIHZhbGlkYXRlKSB7XG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgdGhpcy5wb3J0cmFpdE9yaWVudGF0aW9uID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5fYXNzaWduRnJvbShvYmosIHZhbGlkYXRlKTtcbiAgICB9XG5cbiAgICBfZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAncG9ydHJhaXRPcmllbnRhdGlvbicsIHR5cGU6IGJvb2xlYW5PcHRpb24gfVxuICAgICAgICBdO1xuICAgIH1cbn1cblxuLy9Bc3NlcnRpb25cbmV4cG9ydCBjbGFzcyBBc3NlcnRpb25PcHRpb25zIGV4dGVuZHMgQXNzaWduYWJsZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdmFsaWRhdGUpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzLnRpbWVvdXQgICAgICAgICAgICAgICA9IHZvaWQgMDtcbiAgICAgICAgdGhpcy5hbGxvd1VuYXdhaXRlZFByb21pc2UgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9hc3NpZ25Gcm9tKG9iaiwgdmFsaWRhdGUpO1xuICAgIH1cblxuICAgIF9nZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICd0aW1lb3V0JywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyT3B0aW9uIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdhbGxvd1VuYXdhaXRlZFByb21pc2UnLCB0eXBlOiBib29sZWFuT3B0aW9uIH1cbiAgICAgICAgXTtcbiAgICB9XG59XG4iXX0=