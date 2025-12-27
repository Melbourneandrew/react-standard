/**
 * Type definitions for the visual testing infrastructure.
 */

/** Configuration options for the cursor visual effects */
export interface CursorOptions {
  /** Cursor color (CSS color value) */
  color?: string;
  /** Cursor size in pixels */
  size?: number;
  /** Highlight color when hovering elements */
  highlightColor?: string;
  /** Click ripple color */
  rippleColor?: string;
}

/** Configuration options for the story panel */
export interface StoryOptions {
  /** Panel position on screen */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Panel background color */
  backgroundColor?: string;
  /** Panel text color */
  textColor?: string;
  /** Accent color for keywords */
  accentColor?: string;
}

/** Configuration options for result overlay */
export interface ResultOptions {
  /** Pass state background color */
  passColor?: string;
  /** Fail state background color */
  failColor?: string;
  /** How long to show the overlay (milliseconds) */
  duration?: number;
}

/** Full configuration for createVisualFixtures */
export interface VisualFixtureConfig {
  /** Cursor visual options */
  cursor?: CursorOptions;
  /** Story panel options */
  story?: StoryOptions;
  /** Result overlay options */
  result?: ResultOptions;
}

/** Story step definition for BDD panels */
export interface StoryStep {
  /** Gherkin keyword (Given, When, Then, And, But) */
  keyword: string;
  /** Step description text */
  text: string;
}

/** Internal state for story tracking */
export interface StoryState {
  feature: string;
  scenario: string;
  steps: StoryStep[];
  currentStep: number;
}



