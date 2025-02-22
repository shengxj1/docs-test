import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WordAnalyzer from './WordAnalyzer';
import { renderAsync } from 'docx-preview';

// Mock docx-preview
vi.mock('docx-preview', () => ({
  renderAsync: vi.fn()
}));

describe('WordAnalyzer', () => {
  beforeEach(() => {
    // 清除所有模拟函数的调用记录
    vi.clearAllMocks();
    // 清除 DOM
    document.body.innerHTML = '';
  });

  it('应该正确渲染上传区域', () => {
    render(<WordAnalyzer />);
    expect(screen.getByText('支持 .docx 格式文件')).toBeDefined();
  });

  it('应该在上传非 .docx 文件时显示错误信息', () => {
    render(<WordAnalyzer />);
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    const dropZone = screen.getByText('拖拽 Word 文档到这里或点击上传').parentElement!;

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(screen.getByText('请上传 .docx 格式的文件')).toBeDefined();
  });

  it('应该正确分析包含粗体文本的文档', async () => {
    render(<WordAnalyzer />);
    
    // 模拟 docx 解析结果
    const mockContainer = document.createElement('div');
    const p1 = document.createElement('p');
    p1.innerHTML = '<span style="font-weight: bold">Hello</span> <span>World</span> <span style="font-size: 16px">Test</span>';
    mockContainer.appendChild(p1);
    
    // 模拟 renderAsync
    (renderAsync as jest.Mock).mockImplementation(async (buffer: ArrayBuffer, container: HTMLElement) => {
      container.innerHTML = mockContainer.innerHTML;
      return container;
    });

    // 模拟文件上传
    const fileContent = new Uint8Array([]);
    const file = new File([fileContent], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => fileContent.buffer
    });
    
    const dropZone = screen.getByText('拖拽 Word 文档到这里或点击上传').parentElement;
    if (!dropZone) {
      throw new Error('找不到上传区域');
    }

    // 模拟 getComputedStyle
    const mockGetComputedStyle = vi.spyOn(window, 'getComputedStyle');
    mockGetComputedStyle.mockImplementation((element: Element) => ({
      fontWeight: element instanceof HTMLElement ? element.style.fontWeight || 'normal' : 'normal',
      textDecoration: 'none',
      fontSize: element instanceof HTMLElement ? element.style.fontSize || '12px' : '12px'
    } as CSSStyleDeclaration));

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });

    // 等待异步操作完成
    await screen.findByText(/分析结果/);
    
    expect(screen.getByText(/Hello/)).toBeDefined();
    expect(screen.getByText(/是粗体/)).toBeDefined();
  });
}); 