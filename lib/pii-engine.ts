import { PIIEntity, PIIEntityType, MaskingConfig } from './types';

// Standard Chinese single-character surnames
const SINGLE_SURNAMES = new Set([
  '陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '曾', '邱',
  '廖', '賴', '周', '葉', '蘇', '莊', '呂', '江', '何', '蕭', '羅', '高', '潘', '朱', '簡', '鍾', '彭',
  '游', '詹', '胡', '施', '沈', '余', '趙', '盧', '梁', '顏', '柯', '孫', '魏', '翁', '戴', '范', '宋',
  '方', '鄧', '杜', '傅', '侯', '曹', '薛', '丁', '卓', '馬', '董', '唐', '藍', '石', '蔣', '古', '紀',
  '湯', '馮', '姜', '歐', '程', '田', '袁', '阮', '鐘', '黎', '金', '陸', '郝', '孔', '崔', '康', '毛',
  '史', '顧', '龔', '邵', '萬', '錢', '嚴', '覃', '溫', '彭', '徐', '易', '喬', '莫', '關', '廖', '賈',
  '陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '许', '郑', '谢', '郭', '洪', '曾', '邱',
  '廖', '赖', '周', '叶', '苏', '庄', '吕', '江', '何', '萧', '罗', '高', '潘', '朱', '简', '钟', '彭'
]);

// Compound Chinese surnames (複姓)
const COMPOUND_SURNAMES = [
  '歐陽', '司馬', '上官', '諸葛', '夏侯', '尉遲', '公孫', '申屠', '慕容', '宇文', '司徒', '鮮于',
  '赫連', '皇甫', '羊舌', '澹台', '公冶', '宗政', '濮陽', '淳于', '單于', '太史', '端木', '巫馬',
  '公西', '漆雕', '樂正', '壤駟', '公良', '拓跋', '夾谷', '宰父', '谷梁'
];

// Common false positive words starting with surnames that should NOT be masked
const FALSE_POSITIVES = new Set([
  '陳列', '陳述', '陳舊', '陳設', '林木', '林業', '黃金', '黃昏', '張開', '張貼', '張望', '李子',
  '王國', '王冠', '吳哥', '劉海', '蔡英文', '說明', '注意', '需求', '合作', '服務', '產品', '系統',
  '資料', '問題', '聯絡', '電話', '郵件', '地址', '台中', '台北', '高雄', '台南', '新北', '桃園',
  '新竹', '花蓮', '宜蘭', '苗栗', '彰化', '雲林', '嘉義', '屏東', '南投', '台東', '澎湖', '金門',
  '馬祖', '日本', '韓國', '中國', '美國', '英國', '法國', '德國', '澳洲', '加拿大'
]);

// Singleton segmentit instance
let segmentitInstance: any = null;

function getSegmentit() {
  if (typeof window === 'undefined') return null;
  if (!segmentitInstance) {
    try {
      const segmentitPkg = require('segmentit');
      const { Segment, useDefault, ChsNameTokenizer, ChsNameOptimizer } = segmentitPkg;
      const seg = useDefault(new Segment());
      if (ChsNameTokenizer) seg.use(ChsNameTokenizer);
      if (ChsNameOptimizer) seg.use(ChsNameOptimizer);
      segmentitInstance = seg;
    } catch (e) {
      console.warn('Failed to load segmentit, using fallback regex matcher:', e);
    }
  }
  return segmentitInstance;
}

/**
 * Mask a Chinese Name based on configuration style
 * Example: 張小明 -> 張** (standard), 張** (preserve_first), *** (full_asterisk)
 */
export function maskChineseName(name: string, style: MaskingConfig['chineseMaskStyle'] = 'standard', maskChar: string = '*'): string {
  if (!name) return name;
  const len = name.length;
  
  if (style === 'full_asterisk') {
    return maskChar.repeat(len);
  }

  // Check if compound surname
  const isCompound = COMPOUND_SURNAMES.some(s => name.startsWith(s));
  
  if (isCompound) {
    // 歐陽修 -> 歐** (standard) or 歐陽*
    if (len <= 3) {
      return name[0] + maskChar.repeat(len - 1);
    } else {
      return name.slice(0, 2) + maskChar.repeat(len - 2);
    }
  }

  if (len === 2) {
    // 王偉 -> 王*
    return name[0] + maskChar;
  } else if (len === 3) {
    // 張小明 -> 張**
    return name[0] + maskChar.repeat(2);
  } else {
    // 4+ char double surname e.g. 黃陳美麗 -> 黃***
    return name[0] + maskChar.repeat(len - 1);
  }
}

/**
 * Mask an English Name based on configuration style
 * Example: John Smith -> John S. (initial_last), J. Smith (initial_first), **** ***** (full_asterisk)
 */
export function maskEnglishName(name: string, style: MaskingConfig['englishMaskStyle'] = 'initial_last', maskChar: string = '*'): string {
  if (!name) return name;
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Single word e.g. "Alice" -> "A****"
    const first = parts[0];
    return first[0] + maskChar.repeat(Math.max(1, first.length - 1));
  }

  if (style === 'full_asterisk') {
    return parts.map(p => maskChar.repeat(p.length)).join(' ');
  }

  if (style === 'initial_first') {
    // "John Smith" -> "J. Smith"
    const first = parts[0];
    const rest = parts.slice(1).join(' ');
    return `${first[0]}. ${rest}`;
  }

  // Default: initial_last ("John Smith" -> "John S.")
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
    // Keep first 4 and last 3, mask middle
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
 * Primary Detection Engine for a single string text cell
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

  // Helper to replace matched entity and adjust text
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

  // 2. National ID Card / Passport Detection (Taiwan ID: [A-Z][1289]\d{8}, China ID: \d{17}[\dXx])
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
    // Taiwanese mobile: 09xx-xxx-xxx, 09xxxxxxxx, or international +8869xxxxxxxx
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
    // Matches capitalized English names like "John Smith", "David Miller"
    const engNameRegex = /\b[A-Z][a-z]{1,15}\s+[A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15})?\b/g;
    const matches = Array.from(currentText.matchAll(engNameRegex));
    for (const match of matches) {
      const orig = match[0];
      // Exclude common non-name capitalized English phrases
      if (['United States', 'Taiwan ROC', 'New York', 'Microsoft Corp'].includes(orig)) continue;
      const masked = maskEnglishName(orig, config.englishMaskStyle, config.maskCharacter);
      applyReplacement(orig, masked, 'english_name', '英文姓名');
    }
  }

  // 6. Chinese Name Detection (using Segmentit + Surname Heuristics)
  if (config.enableChineseName) {
    const seg = getSegmentit();
    const candidateNames = new Set<string>();

    // Strategy A: Segmentit Tokenizer
    if (seg) {
      try {
        const tokens = seg.doSegment(currentText);
        for (const token of tokens) {
          // POSTAG.A_NR = 128 (Person Name)
          if (token.p === 128 || token.p === 'nr') {
            if (token.w && token.w.length >= 2 && token.w.length <= 4) {
              candidateNames.add(token.w);
            }
          }
        }
      } catch (e) {
        // Fallback to heuristic matcher below
      }
    }

    // Strategy B: Chinese Surname Heuristic Matcher
    // Compound Surnames (e.g. 歐陽修, 司馬光)
    for (const compSurname of COMPOUND_SURNAMES) {
      let idx = 0;
      while ((idx = currentText.indexOf(compSurname, idx)) !== -1) {
        // Look ahead 1 or 2 characters for given name
        if (idx + compSurname.length + 1 <= currentText.length) {
          const char1 = currentText[idx + compSurname.length];
          if (/[\u4e00-\u9fa5]/.test(char1)) {
            let nameCandidate = compSurname + char1;
            if (idx + compSurname.length + 2 <= currentText.length) {
              const char2 = currentText[idx + compSurname.length + 1];
              if (/[\u4e00-\u9fa5]/.test(char2)) {
                nameCandidate += char2;
              }
            }
            if (!FALSE_POSITIVES.has(nameCandidate)) {
              candidateNames.add(nameCandidate);
            }
          }
        }
        idx += compSurname.length;
      }
    }

    // Single-character Surnames (e.g. 張小明, 李大華, 王偉)
    const chineseChars = Array.from(currentText);
    for (let i = 0; i < chineseChars.length; i++) {
      const char = chineseChars[i];
      if (SINGLE_SURNAMES.has(char)) {
        // Check 3-char name
        if (i + 2 < chineseChars.length) {
          const c2 = chineseChars[i + 1];
          const c3 = chineseChars[i + 2];
          if (/[\u4e00-\u9fa5]/.test(c2) && /[\u4e00-\u9fa5]/.test(c3)) {
            const candidate3 = char + c2 + c3;
            if (!FALSE_POSITIVES.has(candidate3) && !FALSE_POSITIVES.has(char + c2)) {
              // Heuristic checks: given names rarely end with punctuation or prepositions
              if (!['了', '在', '是', '有', '和', '與', '或', '的', '至', '到'].includes(c3)) {
                candidateNames.add(candidate3);
              }
            }
          }
        }

        // Check 2-char name
        if (i + 1 < chineseChars.length) {
          const c2 = chineseChars[i + 1];
          if (/[\u4e00-\u9fa5]/.test(c2)) {
            const candidate2 = char + c2;
            if (!FALSE_POSITIVES.has(candidate2)) {
              // Check context if c2 is a very common verb/noun particle
              if (!['哥', '姐', '氏', '總', '董', '長', '官'].includes(c2) &&
                  !['在', '是', '有', '去', '來', '說', '看', '做', '吃'].includes(c2)) {
                candidateNames.add(candidate2);
              }
            }
          }
        }
      }
    }

    // Sort candidates by length descending (mask 4-char before 3-char before 2-char)
    const sortedCandidates = Array.from(candidateNames).sort((a, b) => b.length - a.length);

    for (const name of sortedCandidates) {
      if (currentText.includes(name)) {
        const masked = maskChineseName(name, config.chineseMaskStyle, config.maskCharacter);
        applyReplacement(name, masked, 'chinese_name', '中文姓名');
      }
    }
  }

  return { maskedText: currentText, entities };
}
