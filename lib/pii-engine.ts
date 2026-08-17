import { PIIEntity, PIIEntityType, MaskingConfig } from './types';

// Clean standard Chinese single-character surnames
const SINGLE_SURNAMES = new Set([
  '陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '曾', '邱',
  '廖', '賴', '周', '葉', '蘇', '莊', '呂', '江', '何', '蕭', '羅', '高', '潘', '朱', '簡', '鍾', '彭',
  '游', '詹', '胡', '施', '沈', '余', '趙', '盧', '梁', '顏', '柯', '孫', '魏', '翁', '戴', '范', '宋',
  '方', '鄧', '杜', '傅', '侯', '曹', '薛', '丁', '卓', '馬', '董', '唐', '藍', '石', '蔣', '古', '紀',
  '常', '薛', '姜', '賈', '嚴', '顧', '龔', '邵', '萬', '錢', '覃', '溫', '徐', '易', '喬', '莫', '關'
]);

// Compound Chinese surnames (複姓)
const COMPOUND_SURNAMES = [
  '歐陽', '司馬', '上官', '諸葛', '夏侯', '尉遲', '公孫', '申屠', '慕容', '宇文', '司徒', '鮮于',
  '赫連', '皇甫', '羊舌', '澹台', '公冶', '宗政', '濮陽', '淳于', '單于', '太史', '端木', '巫馬'
];

// Common non-name vocabulary, politeness words, and business terms that MUST NOT be masked
const COMMON_VOCABULARY = [
  '謝謝', '謝謝您', '感謝', '非常感謝', '祝您', '祝福', '拜託', '麻煩', '請問', '合作', '安排', '協助',
  '處理', '回覆', '收到', '了解', '明白', '辛苦', '順心', '平安', '健康', '快樂', '滿意', '喜歡', '希望',
  '張開', '張貼', '張望', '張羅', '陳列', '陳述', '陳舊', '陳設', '林木', '林業', '林立', '黃金', '黃昏',
  '黃頁', '黃牛', '李子', '李樹', '王國', '王冠', '王朝', '吳哥', '劉海', '周到', '周全', '周密', '周圍',
  '周年', '周邊', '說明', '注意', '需求', '服務', '產品', '系統', '資料', '問題', '聯絡', '電話', '郵件',
  '地址', '門市', '客服', '人員', '意見', '建議', '情況', '內容', '時間', '地點', '單位', '專案', '結果',
  '幫忙', '經理', '主管', '主任', '填寫', '表單', '嘴巴', '看看', '親切', '非常', '就是', '這樣', '那樣',
  '我們', '你們', '您好', '哈囉', '早安', '午安', '晚安', '品質', '價格', '優惠', '商品', '訂單', '發票',
  '回饋', '反饋', '台北', '台中', '台南', '高雄', '新北', '桃園', '新竹', '花蓮', '宜蘭', '苗栗', '彰化',
  '雲林', '嘉義', '屏東', '南投', '台東', '澎湖', '金門', '馬祖', '日本', '韓國', '中國', '美國', '英國',
  '查詢', '洽詢', '諮詢', '三民', '方才', '上官網', '上官方', '官網', '官方', '寵物', '無法',
  '比利', '比利時', '毛小孩', '毛起', '仙台', '申請', '義大利',
  '對方', '我方', '甲方', '乙方', '雙方', '單方', '他方', '校方', '警方', '資方', '勞方',
  '買方', '賣方', '廠方', '院方', '貴方',
  '辦理', '方式', '方案', '紀錄', '查無', '簡訊', '金管', '保單', '變更',
  '萬元', '繳費', '續保', '杜拜', '何時', '程航班', '查證', '月中', '線上', '解決', '加保',
  '進行', '程班', '何變', '理賠', '保險', '嚴重'
];

// Modal particles and auxiliary words that cannot be part of a given name
const INVALID_GIVEN_CHARS = new Set([
  '了', '在', '是', '有', '和', '與', '或', '的', '至', '到', '去', '來', '說', '看', '做', '吃',
  '給', '被', '讓', '把', '向', '對', '從', '用', '及', '等', '因', '為', '在', '過', '也', '您'
]);

// Singleton segmentit instance
let segmentitInstance: any = null;
// Bitmask of POS tags that mark a character as a closed-class function word
// (pronoun/conjunction/preposition/particle/interjection) — these can never be
// part of a person's given name, even when the character is also a known surname
// (e.g. 何 in 為何/如何 is tagged as a pronoun, not a surname).
let functionWordPosMask: number | null = null;
// Bitmask of proper-noun POS tags (place/organization/other-proper-noun). Tokens
// tagged with these are excluded from word-boundary protection: a real personal
// name is far more likely to collide with a place/org name (e.g. 玉山 in 常玉山)
// than with an ordinary common word, so when ambiguous here we still mask.
let properNounPosMask: number | null = null;

function getSegmentit() {
  // Runs in the browser main thread or inside a Web Worker (WorkerGlobalScope
  // has `self` but not `window`) — only skip on the Node.js SSR pass.
  if (typeof self === 'undefined') return null;
  if (!segmentitInstance) {
    try {
      const segmentitPkg = require('segmentit');
      const { Segment, useDefault, ChsNameTokenizer, ChsNameOptimizer, POSTAG } = segmentitPkg;
      const seg = useDefault(new Segment());
      if (ChsNameTokenizer) seg.use(ChsNameTokenizer);
      if (ChsNameOptimizer) seg.use(ChsNameOptimizer);
      segmentitInstance = seg;
      if (POSTAG) {
        functionWordPosMask =
          (POSTAG.D_R || 0) | // 代詞 pronoun (e.g. 何/誰/什麼)
          (POSTAG.D_C || 0) | // 連詞 conjunction (e.g. 又/而/且)
          (POSTAG.D_P || 0) | // 介詞 preposition
          (POSTAG.D_U || 0) | // 助詞 auxiliary particle
          (POSTAG.D_Y || 0) | // 語氣詞 modal particle
          (POSTAG.D_E || 0); // 嘆詞 interjection
        properNounPosMask =
          (POSTAG.A_NS || 0) | // 地名 place name
          (POSTAG.A_NT || 0) | // 機構團體 organization
          (POSTAG.A_NZ || 0); // 其他專名 other proper noun
      }
    } catch (e) {
      console.warn('Failed to load segmentit:', e);
    }
  }
  return segmentitInstance;
}

/**
 * High-Precision Chinese Name Masking
 * Example: 張小明 -> 張**, 歐陽修 -> 歐**
 */
export function maskChineseName(name: string, style: MaskingConfig['chineseMaskStyle'] = 'standard', maskChar: string = '*'): string {
  if (!name) return name;
  const len = name.length;
  
  if (style === 'full_asterisk') {
    return maskChar.repeat(len);
  }

  const isCompound = COMPOUND_SURNAMES.some(s => name.startsWith(s));
  
  if (isCompound) {
    if (len <= 3) {
      return name[0] + maskChar.repeat(len - 1);
    } else {
      return name.slice(0, 2) + maskChar.repeat(len - 2);
    }
  }

  if (len === 2) {
    return name[0] + maskChar;
  } else if (len === 3) {
    return name[0] + maskChar.repeat(2);
  } else {
    return name[0] + maskChar.repeat(len - 1);
  }
}

/**
 * Mask English Name
 */
export function maskEnglishName(name: string, style: MaskingConfig['englishMaskStyle'] = 'initial_last', maskChar: string = '*'): string {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    const first = parts[0];
    return first[0] + maskChar.repeat(Math.max(1, first.length - 1));
  }

  if (style === 'full_asterisk') {
    return parts.map(p => maskChar.repeat(p.length)).join(' ');
  }

  if (style === 'initial_first') {
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    return `${first[0]}. ${rest}`;
  }

  const last = parts[parts.length - 1];
  const firstParts = parts.slice(0, -1).join(' ');
  return `${firstParts} ${last[0]}.`;
}

/**
 * Mask Phone number e.g. 0912-345-678 -> 0912***678
 */
export function maskPhone(phone: string, maskChar: string = '*'): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length >= 7) {
    const start = phone.slice(0, 4);
    const end = phone.slice(-3);
    const middleLen = Math.max(3, phone.length - 7);
    return `${start}${maskChar.repeat(middleLen)}${end}`;
  }
  return phone.replace(/\d/g, maskChar);
}

/**
 * Mask Email e.g. user@example.com -> u***@example.com
 */
export function maskEmail(email: string, maskChar: string = '*'): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) return email;
  const username = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  const maskedUser = username[0] + maskChar.repeat(Math.max(3, username.length - 1));
  return `${maskedUser}${domain}`;
}

/**
 * Mask ID Card / Passport e.g. A123456789 -> A1******89
 */
export function maskIdCard(id: string, maskChar: string = '*'): string {
  if (id.length >= 8) {
    const head = id.slice(0, 2);
    const tail = id.slice(-2);
    const midLen = id.length - 4;
    return `${head}${maskChar.repeat(midLen)}${tail}`;
  }
  return id.replace(/[a-zA-Z0-9]/g, maskChar);
}

/**
 * High-Precision PII Detection Engine
 */
export function detectAndMaskPIIInText(
  text: string,
  config: MaskingConfig
): { maskedText: string; entities: PIIEntity[] } {
  if (!text || typeof text !== 'string') {
    return { maskedText: text || '', entities: [] };
  }

  let currentText = text;
  const entities: PIIEntity[] = [];

  const applyReplacement = (
    orig: string,
    masked: string,
    type: PIIEntityType,
    typeName: string
  ) => {
    let searchIdx = 0;
    while ((searchIdx = currentText.indexOf(orig, searchIdx)) !== -1) {
      entities.push({
        type,
        typeName,
        originalText: orig,
        maskedText: masked,
        startIndex: searchIdx,
        endIndex: searchIdx + orig.length,
      });
      currentText =
        currentText.slice(0, searchIdx) +
        masked +
        currentText.slice(searchIdx + orig.length);
      searchIdx += masked.length;
    }
  };

  // 1. Email Detection
  if (config.enableEmail) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = Array.from(text.matchAll(emailRegex));
    for (const match of matches) {
      const orig = match[0];
      const masked = maskEmail(orig, config.maskCharacter);
      applyReplacement(orig, masked, 'email', '電子郵件');
    }
  }

  // 2. National ID Card / Passport Detection
  if (config.enableIdCard) {
    const twIdRegex = /\b[A-Z][1289]\d{8}\b/g;
    const cnIdRegex = /\b\d{17}[\dXx]\b/g;
    
    const twMatches = Array.from(currentText.matchAll(twIdRegex));
    for (const match of twMatches) {
      const orig = match[0];
      const masked = maskIdCard(orig, config.maskCharacter);
      applyReplacement(orig, masked, 'id_card', '身分證字號');
    }

    const cnMatches = Array.from(currentText.matchAll(cnIdRegex));
    for (const match of cnMatches) {
      const orig = match[0];
      const masked = maskIdCard(orig, config.maskCharacter);
      applyReplacement(orig, masked, 'id_card', '身分證字號');
    }
  }

  // 3. Phone Number Detection
  if (config.enablePhone) {
    const phoneRegex = /(?:\+?886\s?|0)9\d{2}[-\s]?\d{3}[-\s]?\d{3}\b|\b0\d{1,2}[-\s]?\d{6,8}\b/g;
    const matches = Array.from(currentText.matchAll(phoneRegex));
    for (const match of matches) {
      const orig = match[0];
      const masked = maskPhone(orig, config.maskCharacter);
      applyReplacement(orig, masked, 'phone', '電話號碼');
    }
  }

  // 4. Custom User Regex Rules
  if (config.customRules && config.customRules.length > 0) {
    for (const rule of config.customRules) {
      if (!rule.enabled || !rule.pattern) continue;
      try {
        const regex = new RegExp(rule.pattern, 'g');
        const matches = Array.from(currentText.matchAll(regex));
        for (const match of matches) {
          const orig = match[0];
          const masked = config.maskCharacter.repeat(orig.length);
          applyReplacement(orig, masked, 'custom_regex', rule.name || '自訂規則');
        }
      } catch (e) {
        console.warn(`Invalid custom regex pattern [${rule.pattern}]:`, e);
      }
    }
  }

  // 5. English Name Detection
  if (config.enableEnglishName) {
    const engNameRegex = /\b[A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?\b/g;
    const matches = Array.from(currentText.matchAll(engNameRegex));
    for (const match of matches) {
      const orig = match[0];
      if (['United States', 'Taiwan ROC', 'New York', 'Microsoft Corp'].includes(orig)) continue;
      const masked = maskEnglishName(orig, config.englishMaskStyle, config.maskCharacter);
      applyReplacement(orig, masked, 'english_name', '英文姓名');
    }
  }

  // 6. High-Precision Chinese Name Detection (Protected Index Algorithm)
  if (config.enableChineseName) {
    const chars = Array.from(currentText);
    const isProtectedIndex = new Array(chars.length).fill(false);
    // Exclusive end of the span that protected each index. Needed to tell apart
    // "this char is genuinely inside a common word" from "segmentit happened to
    // fuse this char with unrelated *following* text it couldn't otherwise parse"
    // — the latter must not be allowed to veto a real name's last character.
    const protectedSpanEnd = new Array(chars.length).fill(0);

    // Mark character indices of common vocabulary as protected (cannot be sliced into surnames)
    for (const vocab of COMMON_VOCABULARY) {
      let startIdx = 0;
      while ((startIdx = currentText.indexOf(vocab, startIdx)) !== -1) {
        const end = startIdx + vocab.length;
        for (let k = startIdx; k < end; k++) {
          isProtectedIndex[k] = true;
          protectedSpanEnd[k] = end;
        }
        startIdx += vocab.length;
      }
    }

    const candidateNames = new Set<string>();

    // Segmentit POS Tagging + Dictionary Word-Boundary Protection
    // Segmentit's own tokenizer already knows which spans are ordinary dictionary
    // words (e.g. 投保/方案/方式/簡訊/序號). Instead of only trusting the static
    // COMMON_VOCABULARY list, protect ANY multi-char token it did not tag as a name
    // (p !== 128/'nr') so the surname scanner below can never slice across it.
    const seg = getSegmentit();
    if (seg) {
      try {
        const tokens = seg.doSegment(currentText);
        let offset = 0;
        const nameTokenSpans: { w: string; start: number }[] = [];
        for (const token of tokens) {
          const w: string = token.w || '';
          const start = offset;
          offset += w.length;
          const isNameTag = token.p === 128 || token.p === 'nr';
          const isFunctionWord =
            w.length === 1 &&
            typeof token.p === 'number' &&
            functionWordPosMask !== null &&
            (token.p & functionWordPosMask) > 0;
          const isProperNoun =
            typeof token.p === 'number' &&
            properNounPosMask !== null &&
            (token.p & properNounPosMask) > 0;
          if (isNameTag) {
            nameTokenSpans.push({ w, start });
          } else if (
            (w.length >= 2 || isFunctionWord) &&
            !isProperNoun &&
            !COMPOUND_SURNAMES.some(cs => w.startsWith(cs))
          ) {
            // Don't protect spans starting with a compound surname (e.g. 歐陽/上官) —
            // segmentit sometimes lumps an unrecognized name together with trailing
            // characters into one non-name token, and we don't want that to block
            // the compound-surname scan below from still finding the name.
            const end = start + w.length;
            for (let k = start; k < end; k++) {
              isProtectedIndex[k] = true;
              protectedSpanEnd[k] = end;
            }
          }
        }
        for (const { w, start } of nameTokenSpans) {
          if (w.length >= 2 && w.length <= 4 && !COMMON_VOCABULARY.includes(w)) {
            let overlapsProtected = false;
            for (let k = start; k < start + w.length; k++) {
              if (isProtectedIndex[k]) {
                overlapsProtected = true;
                break;
              }
            }
            if (!overlapsProtected) candidateNames.add(w);
          }
        }
      } catch (e) {
        // Fallback
      }
    }

    // Compound Surnames
    for (const comp of COMPOUND_SURNAMES) {
      let idx = 0;
      while ((idx = currentText.indexOf(comp, idx)) !== -1) {
        if (!isProtectedIndex[idx]) {
          const remainingLen = currentText.length - idx;
          if (remainingLen >= 3) {
            let candidate = currentText.slice(idx, idx + (remainingLen >= 4 ? 4 : 3));
            if (candidate.length === 4 && INVALID_GIVEN_CHARS.has(candidate[3])) {
              candidate = candidate.slice(0, 3);
            }
            if (!COMMON_VOCABULARY.some(v => candidate.includes(v))) {
              candidateNames.add(candidate);
            }
          }
        }
        idx += comp.length;
      }
    }

    // Single Surnames with Protected Index Filtering
    for (let i = 0; i < chars.length; i++) {
      if (isProtectedIndex[i]) continue;

      const surname = chars[i];
      if (SINGLE_SURNAMES.has(surname)) {
        // 3-character name e.g. 張小明
        // The last character (c3) is only disqualified if its protecting span ends
        // AT OR BEFORE this candidate's own boundary — if it overhangs further
        // (e.g. segmentit fused it with unrelated trailing text like 明來電), that
        // overhang says nothing about c3 itself and must not block the name.
        const c3Blocked = isProtectedIndex[i + 2] && protectedSpanEnd[i + 2] <= i + 3;
        if (i + 2 < chars.length && !isProtectedIndex[i + 1] && !c3Blocked) {
          const c2 = chars[i + 1];
          const c3 = chars[i + 2];
          if (/[\u4e00-\u9fa5]/.test(c2) && /[\u4e00-\u9fa5]/.test(c3)) {
            const cand3 = surname + c2 + c3;
            if (surname !== c2 && !INVALID_GIVEN_CHARS.has(c3) && !COMMON_VOCABULARY.some(v => cand3.includes(v))) {
              candidateNames.add(cand3);
            }
          }
        }

        // 2-character name e.g. 王偉
        if (i + 1 < chars.length && !isProtectedIndex[i + 1]) {
          const c2 = chars[i + 1];
          if (/[\u4e00-\u9fa5]/.test(c2)) {
            const cand2 = surname + c2;
            const nextChar = i + 2 < chars.length ? chars[i + 2] : '';
            if (surname !== c2 && !INVALID_GIVEN_CHARS.has(c2) && !['！', '!', '？', '?', '您', '了', '經', '官', '長', '員'].includes(nextChar) && !COMMON_VOCABULARY.some(v => cand2.includes(v))) {
              candidateNames.add(cand2);
            }
          }
        }
      }
    }

    // Sort by length descending and filter out substrings
    const sortedCandidates = Array.from(candidateNames).sort((a, b) => b.length - a.length);
    const finalNames: string[] = [];
    for (const name of sortedCandidates) {
      if (!finalNames.some(existing => existing.includes(name))) {
        finalNames.push(name);
      }
    }

    for (const name of finalNames) {
      if (currentText.includes(name)) {
        const masked = maskChineseName(name, config.chineseMaskStyle, config.maskCharacter);
        applyReplacement(name, masked, 'chinese_name', '中文姓名');
      }
    }
  }

  return { maskedText: currentText, entities };
}
