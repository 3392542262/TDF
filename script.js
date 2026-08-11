// ============================================
// 电子工程计算器工具集 - 脚本
// ============================================

// ---------- 通用工具 ----------
const $ = (id) => document.getElementById(id);

function trimNum(n) {
  return parseFloat(n.toPrecision(6)).toString();
}

// ---------- 标签页切换 ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ============================================
// 1. 电阻色环解码器
// ============================================

// 数字环颜色（黑=0 … 白=9）
const DIGIT_COLORS = [
  { name: '黑', hex: '#2b2b2b', value: 0 },
  { name: '棕', hex: '#8b5a2b', value: 1 },
  { name: '红', hex: '#d92b2b', value: 2 },
  { name: '橙', hex: '#e87a1d', value: 3 },
  { name: '黄', hex: '#e8c21d', value: 4 },
  { name: '绿', hex: '#2e9e4f', value: 5 },
  { name: '蓝', hex: '#2b5fd9', value: 6 },
  { name: '紫', hex: '#7b2bd9', value: 7 },
  { name: '灰', hex: '#9aa2ad', value: 8 },
  { name: '白', hex: '#f2f2f2', value: 9 },
];

// 倍率环颜色（数字环的倍率 10^n + 金/银）
const MULTIPLIER_COLORS = DIGIT_COLORS.map((c, i) => ({
  name: c.name,
  hex: c.hex,
  multiplier: Math.pow(10, i),
})).concat([
  { name: '金', hex: '#d4a017', multiplier: 0.1 },
  { name: '银', hex: '#b8b8c9', multiplier: 0.01 },
]);

// 误差环颜色
const TOLERANCE_COLORS = [
  { name: '棕', hex: '#8b5a2b', tolerance: 1 },
  { name: '红', hex: '#d92b2b', tolerance: 2 },
  { name: '绿', hex: '#2e9e4f', tolerance: 0.5 },
  { name: '蓝', hex: '#2b5fd9', tolerance: 0.25 },
  { name: '紫', hex: '#7b2bd9', tolerance: 0.1 },
  { name: '灰', hex: '#9aa2ad', tolerance: 0.05 },
  { name: '金', hex: '#d4a017', tolerance: 5 },
  { name: '银', hex: '#b8b8c9', tolerance: 10 },
];

const RING_DEFS = {
  4: [
    { label: '第1环', colors: DIGIT_COLORS },
    { label: '第2环', colors: DIGIT_COLORS },
    { label: '第3环', colors: MULTIPLIER_COLORS },
    { label: '第4环', colors: TOLERANCE_COLORS },
  ],
  5: [
    { label: '第1环', colors: DIGIT_COLORS },
    { label: '第2环', colors: DIGIT_COLORS },
    { label: '第3环', colors: DIGIT_COLORS },
    { label: '第4环', colors: MULTIPLIER_COLORS },
    { label: '第5环', colors: TOLERANCE_COLORS },
  ],
};

// 当前每环选中的颜色下标（默认 棕黑红金 = 1kΩ ±5%）
let selectedBands = { 4: [1, 0, 2, 6], 5: [1, 0, 0, 2, 0] };

function getBandMode() {
  return document.querySelector('input[name="bandMode"]:checked').value;
}

function renderRings() {
  const mode = getBandMode();
  const defs = RING_DEFS[mode];
  const wrap = $('rings');
  wrap.innerHTML = '';

  defs.forEach((def, i) => {
    const row = document.createElement('div');
    row.className = 'ring-row';

    const name = document.createElement('span');
    name.className = 'ring-name';
    name.textContent = def.label;
    row.appendChild(name);

    const swatches = document.createElement('div');
    swatches.className = 'swatches';

    def.colors.forEach((c, j) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (selectedBands[mode][i] === j ? ' selected' : '');
      sw.style.background = c.hex;
      sw.title = c.name;
      sw.addEventListener('click', () => {
        selectedBands[mode][i] = j;
        renderRings();
        updateResistor();
      });
      swatches.appendChild(sw);
    });

    row.appendChild(swatches);
    wrap.appendChild(row);
  });
}

function formatOhms(o) {
  if (o >= 1e6) return [trimNum(o / 1e6), 'MΩ'];
  if (o >= 1e3) return [trimNum(o / 1e3), 'kΩ'];
  if (o >= 1) return [trimNum(o), 'Ω'];
  return [trimNum(o * 1e3), 'mΩ'];
}

function renderResistorPreview() {
  const mode = getBandMode();
  const defs = RING_DEFS[mode];
  const box = $('resistor-preview');
  box.innerHTML = '';

  const leadL = document.createElement('div');
  leadL.className = 'resistor-lead';
  const leadR = leadL.cloneNode();

  const body = document.createElement('div');
  body.className = 'resistor-body';
  defs.forEach((def, i) => {
    const band = document.createElement('div');
    band.className = 'resistor-band';
    band.style.background = def.colors[selectedBands[mode][i]].hex;
    body.appendChild(band);
  });

  box.append(leadL, body, leadR);
}

function updateResistor() {
  const mode = getBandMode();
  const defs = RING_DEFS[mode];
  const numCount = mode === '4' ? 2 : 3;

  let digits = 0;
  for (let i = 0; i < numCount; i++) {
    digits = digits * 10 + defs[i].colors[selectedBands[mode][i]].value;
  }
  const mult = defs[numCount].colors[selectedBands[mode][numCount]].multiplier;
  const tol = defs[numCount + 1].colors[selectedBands[mode][numCount + 1]].tolerance;

  const [valText, unit] = formatOhms(digits * mult);
  $('resistor-value').textContent = `${valText} ${unit}`;
  $('resistor-tolerance').textContent = `误差 ±${tol}%`;
  renderResistorPreview();
}

document.querySelectorAll('input[name="bandMode"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    renderRings();
    updateResistor();
  });
});

renderRings();
updateResistor();

// ============================================
// 2. RC 截止频率
// ============================================

function formatFrequency(hz) {
  if (hz >= 1e9) return [trimNum(hz / 1e9), 'GHz'];
  if (hz >= 1e6) return [trimNum(hz / 1e6), 'MHz'];
  if (hz >= 1e3) return [trimNum(hz / 1e3), 'kHz'];
  if (hz >= 1) return [trimNum(hz), 'Hz'];
  return [trimNum(hz * 1e3), 'mHz'];
}

function formatSeconds(s) {
  if (s >= 1) return `${trimNum(s)} s`;
  if (s >= 1e-3) return `${trimNum(s * 1e3)} ms`;
  if (s >= 1e-6) return `${trimNum(s * 1e6)} µs`;
  if (s >= 1e-9) return `${trimNum(s * 1e9)} ns`;
  return `${trimNum(s * 1e12)} ps`;
}

function updateRC() {
  const r = parseFloat($('rc-r').value);
  const c = parseFloat($('rc-c').value);
  const out = $('rc-result');
  const extra = $('rc-extra');
  if (!(r > 0) || !(c > 0)) {
    out.textContent = '请输入 R 和 C 后自动计算';
    extra.textContent = '';
    return;
  }
  const R = r * parseFloat($('rc-r-unit').value);
  const C = c * parseFloat($('rc-c-unit').value);
  const f = 1 / (2 * Math.PI * R * C);
  const [v, u] = formatFrequency(f);
  out.textContent = `fc ≈ ${v} ${u}`;
  extra.textContent = `τ = R·C = ${formatSeconds(R * C)}`;
}

['rc-r', 'rc-c', 'rc-r-unit', 'rc-c-unit'].forEach((id) => {
  $(id).addEventListener('input', updateRC);
});

// ============================================
// 3. LC 谐振频率
// ============================================

function updateLC() {
  const l = parseFloat($('lc-l').value);
  const c = parseFloat($('lc-c').value);
  const out = $('lc-result');
  const extra = $('lc-extra');
  if (!(l > 0) || !(c > 0)) {
    out.textContent = '请输入 L 和 C 后自动计算';
    extra.textContent = '';
    return;
  }
  const L = l * parseFloat($('lc-l-unit').value);
  const C = c * parseFloat($('lc-c-unit').value);
  const f = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const [v, u] = formatFrequency(f);
  out.textContent = `f₀ ≈ ${v} ${u}`;
  extra.textContent = `ω₀ = 1/√(LC) ≈ ${trimNum(1 / Math.sqrt(L * C))} rad/s`;
}

['lc-l', 'lc-c', 'lc-l-unit', 'lc-c-unit'].forEach((id) => {
  $(id).addEventListener('input', updateLC);
});

// ============================================
// 4. 欧姆定律 / 功率
// ============================================

function formatVolt(v) {
  if (v >= 1e3) return `${trimNum(v / 1e3)} kV`;
  if (v >= 1) return `${trimNum(v)} V`;
  return `${trimNum(v * 1e3)} mV`;
}

function formatAmp(a) {
  if (a >= 1) return `${trimNum(a)} A`;
  if (a >= 1e-3) return `${trimNum(a * 1e3)} mA`;
  return `${trimNum(a * 1e6)} µA`;
}

function formatOhm(o) {
  if (o >= 1e6) return `${trimNum(o / 1e6)} MΩ`;
  if (o >= 1e3) return `${trimNum(o / 1e3)} kΩ`;
  if (o >= 1) return `${trimNum(o)} Ω`;
  return `${trimNum(o * 1e3)} mΩ`;
}

function formatPower(p) {
  if (p >= 1e6) return `${trimNum(p / 1e6)} MW`;
  if (p >= 1e3) return `${trimNum(p / 1e3)} kW`;
  if (p >= 1) return `${trimNum(p)} W`;
  if (p >= 1e-3) return `${trimNum(p * 1e3)} mW`;
  return `${trimNum(p * 1e6)} µW`;
}

function updateOhm() {
  const u = parseFloat($('ohm-u').value);
  const i = parseFloat($('ohm-i').value);
  const r = parseFloat($('ohm-r').value);
  const out = $('ohm-result');
  const extra = $('ohm-extra');

  const filled = [isFinite(u), isFinite(i), isFinite(r)].filter(Boolean).length;
  if (filled < 2) {
    out.textContent = '请输入任意两个量后自动计算';
    extra.textContent = '';
    return;
  }

  const U = u * parseFloat($('ohm-u-unit').value);
  const I = i * parseFloat($('ohm-i-unit').value);
  const R = r * parseFloat($('ohm-r-unit').value);

  const calcU = isFinite(u) ? U : I * R;
  const calcI = isFinite(i) ? I : U / R;
  const calcR = isFinite(r) ? R : U / I;

  out.textContent = `P = U·I ≈ ${formatPower(calcU * calcI)}`;

  const missing = [];
  if (!isFinite(u)) missing.push(`U ≈ ${formatVolt(calcU)}`);
  if (!isFinite(i)) missing.push(`I ≈ ${formatAmp(calcI)}`);
  if (!isFinite(r)) missing.push(`R ≈ ${formatOhm(calcR)}`);

  if (missing.length > 0) {
    extra.textContent = missing.join('，');
  } else {
    const rel = Math.abs(U - I * R) / Math.max(Math.abs(I * R), 1e-12);
    extra.textContent = rel < 0.01 ? '三个量自洽 ✓' : '提示：U ≠ I×R，数值不自洽';
  }
}

['ohm-u', 'ohm-i', 'ohm-r', 'ohm-u-unit', 'ohm-i-unit', 'ohm-r-unit'].forEach((id) => {
  $(id).addEventListener('input', updateOhm);
});

// ============================================
// 5. 分压计算器
// ============================================

function updateDivider() {
  const vin = parseFloat($('div-vin').value);
  const r1 = parseFloat($('div-r1').value);
  const r2 = parseFloat($('div-r2').value);
  const out = $('div-result');
  const extra = $('div-extra');
  if (!(vin >= 0) || !(r1 > 0) || !(r2 > 0)) {
    out.textContent = '请输入 Vin、R1、R2 后自动计算';
    extra.textContent = '';
    return;
  }
  const Vin = vin * parseFloat($('div-vin-unit').value);
  const R1 = r1 * parseFloat($('div-r1-unit').value);
  const R2 = r2 * parseFloat($('div-r2-unit').value);
  const ratio = R2 / (R1 + R2);
  out.textContent = `Vout ≈ ${formatVolt(Vin * ratio)}`;
  extra.textContent = `分压比 R2/(R1+R2) ≈ ${trimNum(ratio)}`;
}

['div-vin', 'div-r1', 'div-r2', 'div-vin-unit', 'div-r1-unit', 'div-r2-unit'].forEach((id) => {
  $(id).addEventListener('input', updateDivider);
});

// ============================================
// 6. 555 定时器
// ============================================

function getNe555Mode() {
  return document.querySelector('input[name="ne555Mode"]:checked').value;
}

function updateNe555() {
  const mode = getNe555Mode();
  const out = $('ne555-result');
  const extra = $('ne555-extra');

  if (mode === 'mono') {
    const r = parseFloat($('ne555-r').value);
    const c = parseFloat($('ne555-c').value);
    if (!(r > 0) || !(c > 0)) {
      out.textContent = '请输入 R 和 C 后自动计算';
      extra.textContent = '';
      return;
    }
    const R = r * parseFloat($('ne555-r-unit').value);
    const C = c * parseFloat($('ne555-c-unit').value);
    out.textContent = `脉宽 t ≈ ${formatSeconds(1.1 * R * C)}`;
    extra.textContent = 't = 1.1·R·C';
  } else {
    const r1 = parseFloat($('ne555-r1').value);
    const r2 = parseFloat($('ne555-r2').value);
    const c = parseFloat($('ne555-c2').value);
    if (!(r1 > 0) || !(r2 > 0) || !(c > 0)) {
      out.textContent = '请输入 R1、R2 和 C 后自动计算';
      extra.textContent = '';
      return;
    }
    const R1 = r1 * parseFloat($('ne555-r1-unit').value);
    const R2 = r2 * parseFloat($('ne555-r2-unit').value);
    const C = c * parseFloat($('ne555-c2-unit').value);
    const f = 1.44 / ((R1 + 2 * R2) * C);
    const T = 1 / f;
    const t1 = 0.693 * (R1 + R2) * C;
    const t2 = 0.693 * R2 * C;
    const duty = (R1 + R2) / (R1 + 2 * R2);
    const [fv, fu] = formatFrequency(f);
    out.textContent = `f ≈ ${fv} ${fu}`;
    extra.textContent = `周期 T=${formatSeconds(T)}，高电平 ${formatSeconds(t1)}，低电平 ${formatSeconds(t2)}，占空比 ${trimNum(duty * 100)}%`;
  }
}

function syncNe555Mode() {
  const mode = getNe555Mode();
  $('ne555-mono').style.display = mode === 'mono' ? '' : 'none';
  $('ne555-astable').style.display = mode === 'astable' ? '' : 'none';
  updateNe555();
}

document.querySelectorAll('input[name="ne555Mode"]').forEach((radio) => {
  radio.addEventListener('change', syncNe555Mode);
});

['ne555-r', 'ne555-c', 'ne555-r-unit', 'ne555-c-unit',
 'ne555-r1', 'ne555-r2', 'ne555-c2', 'ne555-r1-unit', 'ne555-r2-unit', 'ne555-c2-unit'].forEach((id) => {
  $(id).addEventListener('input', updateNe555);
});

// ============================================
// 7. 运放增益
// ============================================

function getOpampMode() {
  return document.querySelector('input[name="opampMode"]:checked').value;
}

function updateOpamp() {
  const r1 = parseFloat($('opamp-r1').value);
  const r2 = parseFloat($('opamp-r2').value);
  const out = $('opamp-result');
  const extra = $('opamp-extra');
  if (!(r1 > 0) || !(r2 > 0)) {
    out.textContent = '请输入 R1、R2 后自动计算';
    extra.textContent = '';
    return;
  }
  const R1 = r1 * parseFloat($('opamp-r1-unit').value);
  const R2 = r2 * parseFloat($('opamp-r2-unit').value);
  const mode = getOpampMode();
  const gain = mode === 'inv' ? -(R2 / R1) : 1 + R2 / R1;
  const db = 20 * Math.log10(Math.abs(gain));
  const sign = gain < 0 ? '−' : '';
  out.textContent = `增益 G ≈ ${sign}${trimNum(Math.abs(gain))} V/V`;
  extra.textContent = `${mode === 'inv' ? '反相' : '同相'}：20·lg|G| ≈ ${trimNum(db)} dB`;
}

document.querySelectorAll('input[name="opampMode"]').forEach((radio) => {
  radio.addEventListener('change', updateOpamp);
});

['opamp-r1', 'opamp-r2', 'opamp-r1-unit', 'opamp-r2-unit'].forEach((id) => {
  $(id).addEventListener('input', updateOpamp);
});


