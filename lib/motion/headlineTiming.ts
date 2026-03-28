export const MOTION_SPEED_MULTIPLIER = 1;

const withMotionSpeed = (seconds: number) => seconds * MOTION_SPEED_MULTIPLIER;

export const TYPEWRITER_CHAR_DURATION = withMotionSpeed(0.02);
export const TYPEWRITER_CHAR_STAGGER = withMotionSpeed(0.043);
export const LINE_WORD_DURATION = withMotionSpeed(1.14);
export const LINE_WORD_STAGGER = withMotionSpeed(0.148);
export const TYPEWRITER_CARET_START_BUFFER = withMotionSpeed(0.12);
export const TYPEWRITER_CARET_BLINK_DURATION = withMotionSpeed(0.82);
export const HEADLINE_DEFAULT_DELAY = withMotionSpeed(0.05);

export const SCROLL_REVEAL_Y = 12;
export const SCROLL_REVEAL_DURATION = withMotionSpeed(0.68);
export const SCROLL_REVEAL_STAGGER = withMotionSpeed(0.06);
export const SCROLL_REVEAL_START = "top 90%";
