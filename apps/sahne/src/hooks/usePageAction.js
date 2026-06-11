"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePageAction = usePageAction;
var react_1 = require("react");
var SahneAuthContext_1 = require("@/contexts/SahneAuthContext");
function usePageAction(actionId) {
    var recordAction = (0, SahneAuthContext_1.useSahneAuth)().recordAction;
    (0, react_1.useEffect)(function () {
        void recordAction(actionId);
    }, [actionId, recordAction]); // recordAction artık stable (useCallback + userRef)
}
