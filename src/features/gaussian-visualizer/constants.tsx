// Default initial state values for the visualizer
export const INITIAL_MEAN = 100;
export const INITIAL_STDEV = 5;
export const INITIAL_LSL = 85;
export const INITIAL_USL = 115;

// Chart configuration
export const CHART_POINTS = 50;
export const CHART_BOUND_MULTIPLIER = 6;

// === TEXT & CONTENT CONSTANTS ===

export const TEXT_CONTENT = {
  PANEL_TITLES: {
    CONTROLS: 'Distribution Controls',
    INITIAL_SETTINGS: 'Initial Settings',
    METRICS: 'Performance Metrics',
  },

  CONTROL_LABELS: {
    MEAN: 'Mean',
    STDEV: 'Standard Deviation',
    SPEC_LIMITS: 'Specification Limits',
    LSL: 'LSL',
    USL: 'USL',
  },

  BUTTONS: {
    APPLY_DEFAULTS: 'Apply and Set as Default',
  },

  METRIC_LABELS: {
    PP: 'Pp:',
    PPK: 'Ppk:',
    PPM: 'PPM (Total):',
  },

  TOOLTIPS: {
    MEAN: (
      <span>The average value or mathematical center of the distribution.</span>
    ),
    STDEV: (
      <span>
        A measure of the variation or spread of the distribution. A smaller
        value means less variation.
      </span>
    ),
    PP: (
      <>
        <strong>Pp: Potential Capability</strong>
        <p>
          Measures the potential (overall) capability of the process, assuming
          it's perfectly centered.
        </p>
        <code>(USL - LSL) / (6 * StDev)</code>
        <p className='significance'>
          Significance: A higher value means the process spread is much smaller
          than the allowed specification width. It is an "ideal" measure.
        </p>
      </>
    ),
    PPK: (
      <>
        <strong>Ppk: Actual Capability Index</strong>
        <p>
          Measures the actual capability of the process, taking its real-world
          centering into account.
        </p>
        <code>min[(USL - Mean) / (3 * StDev), (Mean - LSL) / (3 * StDev)]</code>
        <p className='significance'>
          {
            'Significance: This is the most critical capability metric. A Ppk < 1.0 indicates the process is producing defects. A common target is ≥ 1.33.'
          }
        </p>
      </>
    ),
    PPM: (
      <>
        <strong>PPM: Parts Per Million</strong>
        <p>
          The expected number of defective parts for every one million parts
          produced, based on the current distribution and limits.
        </p>
        <code>(Total Area Outside Limits) * 1,000,000</code>
        <p className='significance'>
          Significance: A direct, intuitive measure of quality. Lower is better.
        </p>
      </>
    ),
    SPEC_LIMITS: (
      <>
        <strong>LSL & USL: Specification Limits</strong>
        <p>
          The Lower (LSL) and Upper (USL) Specification Limits are the
          engineering requirements. They represent the "voice of the customer."
        </p>
        <p className='significance'>
          Significance: Any part measured outside these limits is considered a
          defect, regardless of the process distribution.
        </p>
      </>
    ),
    INITIAL_SETTINGS: (
      <>
        <strong>Initial Settings Panel</strong>
        <p>
          Use this panel to define your own custom "default" state for the
          visualizer.
        </p>
        <p className='significance'>
          Clicking 'Apply' will save these values and use them for the 'Reset
          Controls & View' button.
        </p>
      </>
    ),
  },
};
