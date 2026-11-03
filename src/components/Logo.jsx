/** `light` = variant for dark/brand backgrounds (white text, icon unchanged). Never recolor with CSS filters. */
export default function Logo({ height = 40, light = false }) {
  return <img src={light ? '/logo-greenit-calc-light.svg' : '/logo-greenit-calc.svg'} alt="GreenIT Calc" style={{ height }} />;
}
