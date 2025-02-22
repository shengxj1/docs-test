import { useState } from 'react';
import { renderAsync } from 'docx-preview';

interface AnalysisResult {
  firstWord: {
    text: string;
    isBold: boolean;
  };
  secondWord: {
    text: string;
    isUnderlined: boolean;
  };
  thirdWord: {
    text: string;
    fontSize: string;
  };
}

export default function WordAnalyzer() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  const analyzeDocument = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const container = document.createElement('div');
      
      await renderAsync(arrayBuffer, container);
      document.body.appendChild(container);
      // document.getElementById('app')?.appendChild(container)
      // 直接获取所有段落元素
      const paragraphs = container.querySelectorAll('p>span');
      const words: { text: string; element: Element }[] = [];
      

      // 遍历段落元素获取单词
      [...paragraphs].some(p => {
        const text = p.textContent?.trim() || '';
        if (!text) return false;

        const wordsInParagraph = text.split(/\s+/);
        wordsInParagraph.forEach(word => {
          if (word) {
            words.push({ text: word, element: p });
          }
        });
        if(words.length >= 3) return true;
      });
      console.log([
        words[0].element,
        words[1].element,
        words[2].element

      ].map(v=>v.style))
      if (words.length < 3) {
        document.body.removeChild(container);
        throw new Error('文档中单词数量不足');
      }
      // window.getComputedStyle maybe better
      const analysis: AnalysisResult = {
        firstWord: {
          text: words[0].text,
          // or 700
          isBold: words[0].element.style.fontWeight === 'bold' ,
        },
        secondWord: {
          text: words[1].text,
          isUnderlined: words[1].element.style.textDecoration.includes('underline'),
        },
        thirdWord: {
          text: words[2].text,
          fontSize: words[2].element.style.fontSize,
        },
      };

      document.body.removeChild(container);
      setResult(analysis);
      setError('');
    } catch (err) {
      console.error('Document parsing error:', err);
      setError(err instanceof Error ? err.message : '解析文档时发生错误');
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.docx')) {
      analyzeDocument(file);
    } else {
      setError('请上传 .docx 格式的文件');
    }
  };

  return (
    <div>
      <div
        className="drop-zone"
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: isDragging ? '#f0f0f0' : 'transparent',
          cursor: 'pointer'
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          type="file"
          id="fileInput"
          accept=".docx"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) analyzeDocument(file);
          }}
        />
        <div style={{ marginBottom: '10px' }}>
          拖拽 Word 文档到这里或点击上传
        </div>
        <p style={{ margin: 0, color: '#666' }}>
          支持 .docx 格式文件
        </p>
      </div>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>分析结果</h3>
          <div>
            <p>第一个单词 "<span>{result.firstWord.text}</span>":
              <span>{result.firstWord.isBold ? ' 是粗体' : ' 不是粗体'}</span>
            </p>
            <p>第二个单词 "<span>{result.secondWord.text}</span>":
              <span>{result.secondWord.isUnderlined ? ' 有下划线' : ' 没有下划线'}</span>
            </p>
            <p>第三个单词 "<span>{result.thirdWord.text}</span>":
              字体大小 <span>{result.thirdWord.fontSize}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 