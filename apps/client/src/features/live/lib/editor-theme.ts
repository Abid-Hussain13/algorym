import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

/**
 * CodeMirror styling that defers to the app's design tokens.
 *
 * The app already defines `--color-syn-*`, `--font-mono` and `data-theme="dark"`
 * on `:root`, so referencing them here means the editor follows the theme
 * automatically — no React state, no re-mounting the editor on toggle, and no
 * second palette to keep in sync.
 */
const base = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "var(--color-bg)",
        color: "var(--color-fg)",
        fontSize: "13px",
    },
    ".cm-scroller": {
        fontFamily: "var(--font-mono)",
        lineHeight: "1.6",
    },
    ".cm-content": { caretColor: "var(--color-accent)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--color-accent)" },
    "&.cm-focused": { outline: "none" },
    ".cm-gutters": {
        backgroundColor: "var(--color-bg)",
        color: "var(--color-muted)",
        border: "none",
        borderRight: "1px solid var(--color-border)",
    },
    ".cm-activeLine": { backgroundColor: "color-mix(in oklab, var(--color-fg) 4%, transparent)" },
    ".cm-activeLineGutter": {
        backgroundColor: "color-mix(in oklab, var(--color-fg) 6%, transparent)",
        color: "var(--color-fg)",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "color-mix(in oklab, var(--color-accent) 22%, transparent)",
    },
    "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "color-mix(in oklab, var(--color-accent) 26%, transparent)",
    },
    // Remote cursors and selections are injected by y-codemirror.next and use
    // each participant's own colour; only the shape needs styling here.
    ".cm-ySelection": { opacity: "0.35" },
    ".cm-ySelectionCaret": {
        borderLeftWidth: "2px",
        borderLeftStyle: "solid",
    },
    // Autocomplete popup, themed from the same tokens as the editor itself.
    ".cm-tooltip": {
        backgroundColor: "var(--color-bg)",
        color: "var(--color-fg)",
        border: "1px solid var(--color-border)",
        borderRadius: "0.5rem",
        overflow: "hidden",
        boxShadow: "0 8px 24px -8px rgb(0 0 0 / 0.35)",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul": {
        fontFamily: "var(--font-body)",
        fontSize: "12px",
        maxHeight: "14rem",
    },
    ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
        padding: "4px 10px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
        backgroundColor: "var(--color-accent-soft)",
        color: "var(--color-accent-text)",
    },
    ".cm-completionIcon": {
        opacity: "0.7",
        paddingRight: "2px",
    },
    ".cm-completionLabel": { flex: "0 1 auto" },
    ".cm-completionDetail": {
        marginLeft: "auto",
        fontStyle: "italic",
        color: "var(--color-muted)",
        fontSize: "11px",
    },
    // The docs panel (Enter / Ctrl-Space on a symbol) reuses the same tooltip.
    ".cm-completionInfo": {
        backgroundColor: "var(--color-bg)",
        color: "var(--color-muted)",
        borderLeft: "1px solid var(--color-border)",
        fontFamily: "var(--font-body)",
        fontSize: "11px",
        maxWidth: "22rem",
        padding: "6px 8px",
    },
});

const highlightStyle = HighlightStyle.define([
    { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--color-syn-comment)", fontStyle: "italic" },
    { tag: [t.string, t.special(t.string)], color: "var(--color-syn-string)" },
    { tag: [t.keyword, t.operator, t.moduleKeyword], color: "var(--color-syn-keyword)" },
    { tag: [t.function(t.variableName), t.function(t.propertyName)], color: "var(--color-syn-fn)" },
    { tag: [t.constant(t.variableName), t.standard(t.variableName), t.typeName], color: "var(--color-syn-constant)" },
    { tag: [t.number, t.bool, t.null, t.atom], color: "var(--color-syn-number)" },
    { tag: [t.propertyName, t.attributeName], color: "var(--color-fg)" },
    { tag: [t.punctuation, t.separator, t.bracket], color: "var(--color-muted)" },
    { tag: [t.className, t.namespace], color: "var(--color-syn-constant)" },
    { tag: t.invalid, color: "var(--color-danger)" },
]);

export const editorTheme = [base, syntaxHighlighting(highlightStyle)];
