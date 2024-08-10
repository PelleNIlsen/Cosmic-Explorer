let tooltip;

export function showTooltip(x, y, text) {
    tooltip.setText(text);
    tooltip.setPosition(x, y - tooltip.height - 10);
    tooltip.setVisible(true);
}