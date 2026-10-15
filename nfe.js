// Leitura da DANFE (nota fiscal eletrônica em PDF) para preencher as entradas.
// Funciona com o PDF que a loja envia, que já traz o texto; foto de nota não tem texto para ler.
(function (raiz) {
  "use strict";
  const NUM = "\\d{1,3}(?:\\.\\d{3})*,\\d{2,10}";
  // quantidade: algumas lojas escrevem sem casas decimais ("8" em vez de "8,0000")
  const QTD = "\\d{1,3}(?:\\.\\d{3})*(?:,\\d{1,10})?";
  const UNIDADES = "UN|UND|UNID|PC|PCS|PCT|PT|CX|M|MT|MTS|M2|M3|KG|G|GR|L|LT|ML|RL|RLO|SC|SACO|GL|GALAO|JG|KIT|PAR|BD|BL|FD|TB|CJ|CT|LATA|LT|FR|BR|BARRA|DZ|CENTO|MIL|TON";
  const numBR = s => Number(String(s).replace(/\./g, "").replace(",", "."));

  // junta os pedaços de texto do PDF em linhas, na ordem da página; colunas separadas por dois espaços
  function montarLinhas(paginas) {
    const linhas = [];
    paginas.forEach(itens => {
      const pedacos = itens.filter(i => i && typeof i.str === "string" && i.str.trim() !== "")
        .map(i => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width || 0, h: Math.abs(i.transform[3]) || Math.abs(i.transform[0]) || 8 }));
      pedacos.sort((a, b) => b.y - a.y || a.x - b.x);
      const grupos = [];
      pedacos.forEach(p => {
        const g = grupos.find(g => Math.abs(g.y - p.y) <= Math.max(2, p.h * 0.35));
        if (g) g.itens.push(p); else grupos.push({ y: p.y, itens: [p] });
      });
      grupos.sort((a, b) => b.y - a.y);
      grupos.forEach(g => {
        g.itens.sort((a, b) => a.x - b.x);
        let txt = "", fim = null;
        g.itens.forEach(p => {
          if (fim === null) txt = p.s;
          else {
            const vao = p.x - fim, letra = p.h * 0.5;
            txt += vao > letra * 1.6 ? "  " + p.s : vao > letra * 0.15 ? " " + p.s : p.s;
          }
          fim = p.x + p.w;
        });
        linhas.push(txt.replace(/\s+$/, ""));
      });
      linhas.push("");
    });
    return linhas;
  }

  function limparDescricao(s) {
    return String(s).replace(/\s{2,}/g, " ").replace(/[\s$*#]+$/g, "").replace(/^[\s\-–]+/, "").trim();
  }

  function lerDanfe(linhas) {
    const texto = linhas.join("\n");
    const um = (re, t) => { const m = re.exec(t === undefined ? texto : t); return m ? m[1].trim() : ""; };
    const out = { fornecedor: "", numero: "", data: "", valorTotal: null, chave: "", itens: [] };

    out.fornecedor = um(/RECEBEMOS DE\s+(.+?)\s+OS PRODUTOS/i).replace(/\s{2,}/g, " ");
    if (!out.fornecedor) {
      // nome do emitente na linha de baixo do canhoto
      const i = linhas.findIndex(l => /RECEBEMOS DE/i.test(l));
      const prox = i >= 0 ? (linhas[i + 1] || "").split(/\s{2,}/)[0].trim() : "";
      if (prox && /[a-z]{3}/i.test(prox) && !/^(N[º°o]|DATA|S[ÉE]RIE|DANFE)/i.test(prox)) out.fornecedor = prox;
    }
    if (!out.fornecedor) {
      const i = linhas.findIndex(l => /IDENTIFICA[CÇ][AÃ]O DO EMITENTE/i.test(l));
      if (i >= 0) out.fornecedor = (linhas.slice(i + 1, i + 4).map(l => l.split(/\s{2,}/)[0].trim()).filter(Boolean)[0] || "");
    }
    const n = um(/N[º°o]\.?\s*:?\s*(\d{1,3}(?:\.\d{3})+|\d{3,9})\b/);
    out.numero = n ? String(Number(n.replace(/\./g, ""))) : "";
    const d = um(/EMISS[ÃA]O:\s*(\d{2}\/\d{2}\/\d{4})/i) || um(/DATA (?:DA|DE) EMISS[ÃA]O[\s\S]{0,400}?(\d{2}\/\d{2}\/\d{4})/i);
    if (d) { const [dd, mm, aa] = d.split("/"); out.data = aa + "-" + mm + "-" + dd; }
    const vt = um(/VALOR TOTAL:\s*R\$\s*(\d{1,3}(?:\.\d{3})*,\d{2})/i) || um(/VALOR TOTAL DA NOTA[^\n]*\n[^\n]*?(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/im);
    if (vt) out.valorTotal = numBR(vt);
    const ch = /((?:\d{4}\s?){11})/.exec(texto.replace(/[^\d\s]/g, " ").replace(/ {2,}/g, " "));
    if (ch) out.chave = ch[1].replace(/\s/g, "");

    // tabela de produtos: entre "DADOS DO(S) PRODUTO(S)" e "DADOS ADICIONAIS" (ou cálculo do ISSQN)
    let ini = linhas.findIndex(l => /DADOS DOS? PRODUTOS?/i.test(l));
    if (ini < 0) ini = 0;
    let fim = linhas.findIndex((l, i) => i > ini && /DADOS ADICIONAIS|C[AÁ]LCULO DO ISSQN|INFORMA[CÇ][OÕ]ES COMPLEMENTARES/i.test(l));
    if (fim < 0) fim = linhas.length;
    const reCompleta = new RegExp("^\\s*(\\S+)\\s+(.+?)\\s+(\\d{8})\\s+(\\d{3,4})\\s+(\\d{4})\\s+([A-Za-z][A-Za-z0-9]{0,5})\\s+(" + QTD + ")\\s+(" + NUM + ")\\s+(" + NUM + ")");
    const reSimples = new RegExp("^\\s*(?:(\\d{3,14})\\s+)?(.+?)\\s+(" + UNIDADES + ")\\s+(" + NUM + ")\\s+(" + NUM + ")\\s+(" + NUM + ")", "i");
    const cabecalho = /DESCRI[CÇ][AÃ]O|C[OÓ]DIGO|QUANT|UNIT[AÁ]RIO|PROD\.|CSOSN|AL[IÍ]QUOTAS|NCM/i;
    let ultimo = null;
    for (let i = ini + 1; i < fim; i++) {
      const l = linhas[i];
      if (!l.trim()) { ultimo = null; continue; }
      let m = reCompleta.exec(l), item = null;
      if (m) item = { codigo: m[1], descricao: m[2], unidade: m[6], qtd: numBR(m[7]), valorUnit: numBR(m[8]), valorTotal: numBR(m[9]) };
      else if ((m = reSimples.exec(l))) item = { codigo: m[1] || "", descricao: m[2].replace(/\s+\d{8}(\s+\d{3,4}){0,2}\s*$/, ""), unidade: m[3].toUpperCase(), qtd: numBR(m[4]), valorUnit: numBR(m[5]), valorTotal: numBR(m[6]) };
      if (item && item.qtd > 0) {
        item.descricao = limparDescricao(item.descricao);
        out.itens.push(item); ultimo = item; continue;
      }
      // descrição que quebrou para a linha de baixo
      const resto = l.split(/\s{2,}/).map(s => s.trim()).filter(Boolean);
      if (ultimo && resto.length === 1 && !cabecalho.test(l) && !/\d,\d{2}/.test(l) && resto[0].length < 80) {
        ultimo.descricao = limparDescricao(ultimo.descricao + " " + resto[0]);
      } else ultimo = null;
    }
    return out;
  }

  // ---------- foto da nota (texto vindo do reconhecimento de caracteres) ----------
  // o OCR troca letras por números ("O"→0, "S"→5), perde vírgulas ("800" = 8,00) e lê as bordas
  // da tabela como "|" ou "[". Por isso cada linha é aceita quando quantidade × unitário = total.
  const TROCA = { O: "0", o: "0", Q: "0", D: "0", l: "1", I: "1", i: "1", "!": "1", "|": "1", S: "5", s: "5", B: "8", Z: "2", z: "2", g: "9", q: "9" };
  const reUnidade = new RegExp("^(?:" + UNIDADES + ")$", "i");
  function digitos(tok) {
    const t = String(tok).replace(/[.,;:]+$/, "").replace(/^[.,]+/, "");
    if (!t || !/\d/.test(t)) return null;
    const f = t.replace(/[OoQDlIi!|SsBZzgq]/g, c => TROCA[c]);
    return /^\d+(?:[.,]\d+)*$/.test(f) ? f : null;
  }
  // valores possíveis de um número lido: com separador decimal, ou sem a vírgula que sumiu
  function candidatos(f, qtd) {
    const m = /^(.*?)[.,](\d{1,4})$/.exec(f);
    if (m) {
      const v = Number(m[1].replace(/[.,]/g, "") + "." + m[2]);
      return [{ v, p: 0 }];
    }
    const n = Number(f);
    // preço na DANFE sempre tem centavos: sem vírgula, o mais provável é que ela tenha sumido
    if (!qtd) return f.length >= 3 ? [{ v: n / 100, p: 1 }, { v: n, p: 2 }] : [{ v: n, p: 2 }];
    const out = [{ v: n, p: 0 }];
    if (f.length >= 3) out.push({ v: n / 100, p: 1 });
    if (f.length >= 4) out.push({ v: n / 1000, p: 2 }, { v: n / 10000, p: 2 });
    return out;
  }
  function linhaDeProdutoFoto(linha) {
    const limpa = linha.replace(/[\[\]{}()“”"'‘’`~«»_—–=*®©°¢$^]+/g, " ").replace(/\|/g, " | ").replace(/\s+/g, " ").trim();
    const toks = limpa.split(" ").filter(t => t !== "|");
    for (let u = 1; u < toks.length - 1; u++) {
      if (!reUnidade.test(toks[u])) continue;
      // números depois da unidade (pula lixo curto que o OCR solta no meio)
      const nums = [];
      for (let k = u + 1; k < toks.length && nums.length < 5; k++) {
        const f = digitos(toks[k]);
        if (f) nums.push(f); else if (toks[k].length > 3) break;
      }
      if (nums.length < 2) continue;
      // descrição: entre o código e o NCM (8 dígitos)
      let ini = 0, codigo = "";
      const c0 = digitos(toks[0].replace(/\.$/, ""));
      if (c0 && /^\d{3,14}$/.test(c0)) { codigo = c0; ini = 1; }
      let fimDesc = u;
      for (let k = u - 1; k > ini; k--) {
        const f = digitos(toks[k].replace(/^[^\dOoSsIl]+/, ""));
        if (f && /^\d{7,9}$/.test(f.replace(/[.,]/g, ""))) { fimDesc = k; break; }
      }
      if (fimDesc === u) { // sem NCM legível: tira CST/CFOP do fim
        while (fimDesc - 1 > ini && digitos(toks[fimDesc - 1]) && /^\d{3,4}$/.test(digitos(toks[fimDesc - 1]))) fimDesc--;
      }
      const palavras = toks.slice(ini, fimDesc);
      while (palavras.length && palavras[0].length === 1 && !/\d/.test(palavras[0])) palavras.shift();
      // descrição em maiúsculas: palavras com minúsculas no fim são lixo do OCR (ex.: "sa0s", "eo")
      const maiusc = palavras.filter(w => /[A-Z]{2}/.test(w)).length >= Math.max(1, palavras.length / 2);
      while (palavras.length > 1) {
        const w = palavras[palavras.length - 1];
        if ((w.length === 1 && !/\d/.test(w)) || (maiusc && /[a-z]/.test(w)) || /^[^A-Za-z0-9]+$/.test(w)) palavras.pop(); else break;
      }
      // borda da tabela lida como "I" grudado na primeira palavra ("ICARTUCHO")
      if (palavras.length && /^[Il|][BCFHJKPQVWXYZ][A-Z]{2,}/.test(palavras[0])) palavras[0] = palavras[0].slice(1);
      const descricao = limparDescricao(palavras.join(" ").replace(/^[^A-Za-z0-9À-ú]+/, ""));
      if (!/[A-Za-zÀ-ú]{3}/.test(descricao)) continue;
      // procura quantidade × unitário = total entre os primeiros números
      let melhor = null;
      for (let a = 0; a + 2 < nums.length && a < 2; a++) {
        candidatos(nums[a], true).forEach(q => candidatos(nums[a + 1]).forEach(vu => candidatos(nums[a + 2]).forEach(vt => {
          if (q.v <= 0 || vu.v <= 0 || vt.v <= 0) return;
          if (Math.abs(q.v * vu.v - vt.v) > 0.011 + vt.v * 0.0005) return;
          const p = q.p + vu.p + vt.p + a;
          if (!melhor || p < melhor.p) melhor = { p, qtd: q.v, valorUnit: vu.v, valorTotal: vt.v };
        })));
      }
      if (!melhor) {
        // quantidade ilegível: unitário e total seguidos, e a quantidade sai da divisão
        for (let a = 0; a + 1 < nums.length && a < 3; a++) {
          candidatos(nums[a]).forEach(vu => candidatos(nums[a + 1]).forEach(vt => {
            if (vu.v <= 0 || vt.v <= 0) return;
            const q = vt.v / vu.v, r = Math.round(q);
            if (r < 1 || r > 999 || Math.abs(q - r) > 0.001) return;
            const p = 3 + vu.p + vt.p + a;
            if (!melhor || p < melhor.p) melhor = { p, qtd: r, valorUnit: vu.v, valorTotal: vt.v };
          }));
        }
      }
      let item;
      if (melhor) item = { qtd: melhor.qtd, valorUnit: melhor.valorUnit, valorTotal: melhor.valorTotal, incerto: melhor.p > 1 };
      else {
        // não fechou a conta: aproveita o que der e marca para conferir
        const dec = nums.map(f => candidatos(f)[0]).map((c, k) => /[.,]\d{2}$/.test(nums[k]) ? c.v : null);
        const q = /^\d{1,4}$/.test(nums[0]) ? Number(nums[0]) : (dec[0] || 1);
        const vt = dec[2] != null ? dec[2] : dec[1] != null && dec[1] > 0 ? null : null;
        const vu = dec[1] != null ? dec[1] : vt != null && q ? vt / q : 0;
        item = { qtd: q || 1, valorUnit: vu || 0, valorTotal: vt != null ? vt : (q || 1) * (vu || 0), incerto: true };
      }
      return Object.assign({ codigo, descricao, unidade: toks[u].toUpperCase() }, item);
    }
    return null;
  }
  function lerFotoDanfe(linhas) {
    linhas = linhas.map(l => String(l || "").replace(/\s+/g, " ").trim());
    const out = lerDanfe(linhas.map(l => l)); // cabeçalho com as mesmas regras do PDF
    out.foto = true;
    const texto = linhas.join("\n");
    // fornecedor: a primeira razão social (termina em LTDA, S/A, EIRELI, ME, EPP)
    const forn = linhas.slice(0, 25).map(l => /^(.*?\b(?:LTDA|EIRELI|S\/A|S\.A|EPP)\b\.?)/i.exec(l.replace(/^[^A-Za-z0-9]+/, "")))
      .filter(m => m && /[A-Za-z]{3}/.test(m[1]) && !/RECEBEMOS|PRODUTOS/i.test(m[1])).map(m => m[1].replace(/\s{2,}/g, " ").trim())
      .sort((a, b) => (/^[A-Z0-9]/.test(b) - /^[A-Z0-9]/.test(a)) || b.length - a.length)[0];
    if (forn && (!out.fornecedor || /RECEBEMOS|PRODUTOS/i.test(out.fornecedor))) out.fornecedor = forn;
    if (!out.numero) { const m = /\b(\d{3}\.\d{3}\.\d{3})\b/.exec(texto); if (m) out.numero = String(Number(m[1].replace(/\./g, ""))); }
    if (!out.data) { const m = /\b(\d{2})\/(\d{2})\/(20\d{2})\b/.exec(texto); if (m) out.data = m[3] + "-" + m[2] + "-" + m[1]; }
    const fim = linhas.findIndex(l => /DADOS ADICIONAIS|C[AÁ]LCULO DO ISSQN|INFORMA[CÇ][OÕ]ES COMPLEMENTARES/i.test(l));
    out.itens = [];
    linhas.slice(0, fim > 0 ? fim : linhas.length).forEach(l => {
      if (/CARGA TRIBUT|FCP|FATURA|VALOR (DO|TOTAL)|BASE DE C/i.test(l)) return;
      const it = linhaDeProdutoFoto(l);
      if (it) out.itens.push(it);
    });
    return out;
  }

  // sugere os itens do estoque mais parecidos com a descrição da nota
  const PARADAS = new Set(["de", "da", "do", "das", "dos", "p", "para", "com", "c", "e", "em", "un", "und", "pc", "cx", "kit"]);
  function fichas(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .replace(/(\d)([a-z])/g, "$1 $2").replace(/([a-z])(\d)/g, "$1 $2")
      .split(/[^a-z0-9]+/).filter(t => t && !PARADAS.has(t));
  }
  function parecido(desc, nome) {
    const a = fichas(desc), b = fichas(nome);
    if (!a.length || !b.length) return 0;
    let pontos = 0;
    a.forEach(t => {
      let melhor = 0;
      b.forEach(u => {
        if (t === u) melhor = 1;
        else if (t.length >= 3 && u.length >= 3 && (u.startsWith(t) || t.startsWith(u))) melhor = Math.max(melhor, 0.75);
        else if (t.length >= 4 && u.length >= 4 && t.slice(0, 4) === u.slice(0, 4)) melhor = Math.max(melhor, 0.5);
      });
      pontos += /^\d+$/.test(t) ? melhor * 0.6 : melhor;
    });
    const peso = a.reduce((s, t) => s + (/^\d+$/.test(t) ? 0.6 : 1), 0);
    return pontos / Math.max(peso, Math.min(b.length, 4) * 0.8);
  }
  // quanto do nome do item do estoque aparece na descrição da nota (1 = todas as palavras)
  function cobertura(desc, nome) {
    const a = fichas(desc), b = fichas(nome).filter(t => t.length >= 2);
    if (!b.length) return 0;
    const acha = u => a.some(t => t === u || (t.length >= 3 && u.length >= 3 && (t.startsWith(u) || u.startsWith(t))));
    return b.filter(acha).length / b.length;
  }
  function sugerir(desc, itens, n) {
    return itens.map(it => ({ it, nota: parecido(desc, it.nome + " " + (it.codigo || "")), cobre: cobertura(desc, it.nome) }))
      .filter(x => x.nota > 0.2).sort((x, y) => (y.nota - x.nota) || (y.cobre - x.cobre)).slice(0, n || 5);
  }

  raiz.LeitorNF = { montarLinhas, lerDanfe, lerFotoDanfe, sugerir, parecido, cobertura };
})(typeof window !== "undefined" ? window : globalThis);
