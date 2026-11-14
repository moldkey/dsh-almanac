/**
 * dsh-almanac — 黄历与干支（中性名，本地计算）
 */

export const name = "dsh-almanac";
export const inject = ["tools"];

const NL = String.fromCharCode(10);
const SITE = "https://deepseekbase.com/zh/plugins/new/";

const TEXT_OUTPUT = {
  schema: { type: "object", additionalProperties: false, properties: { text: { type: "string" } }, required: ["text"] },
  render: (_args, value) => [{ type: "text", text: (value && value.text) || "" }],
};

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";
const ZODIAC = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
const TERMS = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"];
const C = [5.4055,20.12,3.87,18.73,5.63,20.646,4.81,20.1,5.52,21.04,5.678,21.37,7.108,22.83,7.5,23.13,7.646,23.042,8.318,23.438,7.438,22.36,7.18,21.94];

function n(v) { const x = Number(String(v).replace(/[^\d.-]/g, "")); if (!Number.isFinite(x)) throw new Error("需要数字"); return Math.floor(x); }
function f(x) { return (Math.round(x * 100) / 100).toString(); }

const TOOLS = {
  almanac_ganzhi: {
    description: "干支纪年与生肖：输入公历年份，输出天干地支与生肖",
    parameters: { type: "object", additionalProperties: false, properties: { text: { type: "string", required: true, description: "公历年份，如 2026" } }, required: ["text"] },
    run(args) {
      const y = n(args.text);
      const g = (y - 4) % 10, z = (y - 4) % 12;
      return ["干支纪年", "=".repeat(40), "公历: " + y, "干支: " + GAN[g] + ZHI[z] + "年", "生肖: " + ZODIAC[z]].join(NL);
    },
  },
  almanac_solar_terms: {
    description: "二十四节气：按年份给出各节气的大致日期（近似算法，±1 天）",
    parameters: { type: "object", additionalProperties: false, properties: { text: { type: "string", required: true, description: "年份，如 2026" } }, required: ["text"] },
    run(args) {
      const y = n(args.text);
      const yy = (y - 1) % 100;
      const lines = ["二十四节气（" + y + "，近似）", "=".repeat(40)];
      for (let i = 0; i < 24; i++) {
        const month = Math.floor(i / 2) + 1;
        const leap = Math.floor((yy - 1) / 4);
        const day = Math.floor(yy * 0.2422 + C[i]) - leap;
        lines.push(TERMS[i] + "：" + month + " 月 " + day + " 日左右");
      }
      lines.push("", "说明：节气按通用近似公式计算，与官方历书可能差 1 天；精确日期以天文年历为准。");
      return lines.join(NL);
    },
  },
  almanac_date_info: {
    description: "日期信息：星期、干支年、生肖、当年所处节气区间（近似）",
    parameters: { type: "object", additionalProperties: false, properties: { text: { type: "string", required: true, description: "日期 YYYY-MM-DD" } }, required: ["text"] },
    run(args) {
      const m = String(args.text).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (!m) throw new Error("格式 YYYY-MM-DD");
      const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
      const dt = new Date(y, mo - 1, d);
      if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) throw new Error("日期不存在");
      const week = ["日","一","二","三","四","五","六"][dt.getDay()];
      const g = (y - 4) % 10, z = (y - 4) % 12;
      const yy = (y - 1) % 100, leap = Math.floor((yy - 1) / 4);
      const termDays = TERMS.map((t, i) => ({ t, mo: Math.floor(i / 2) + 1, d: Math.floor(yy * 0.2422 + C[i]) - leap }));
      const idx = (mo - 1) * 2;
      const cur = termDays.reduce((a, b) => (b.mo < mo || (b.mo === mo && b.d <= d) ? b : a), termDays[0]);
      return ["日期信息", "=".repeat(40), "公历: " + args.text, "星期" + week, "干支年: " + GAN[g] + ZHI[z] + "（" + ZODIAC[z] + "）", "所处节气: " + cur.t + " 之后（近似）", "", "说明：干支仅按年计算，节气为近似值；不构成任何预测或建议。"].join(NL);
    },
  },
};

export function apply(ctx, config) {
  void config;
  for (const name of Object.keys(TOOLS)) {
    const t = TOOLS[name];
    ctx.tools.register({
      name: name,
      description: t.description,
      parameters: t.parameters,
      output: TEXT_OUTPUT,
      async execute(args) { try { return { text: t.run(args || {}) }; } catch (e) { return { text: "处理失败: " + String((e && e.message) || e) }; } },
    });
  }
}
