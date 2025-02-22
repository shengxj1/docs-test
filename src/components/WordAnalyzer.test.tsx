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

  async function mockRender(htmlString:string){
    render(<WordAnalyzer />);
    
    // 模拟 
    const mockContainer = document.createElement('div');
    const p1 = document.createElement('p');
    p1.innerHTML = htmlString;
    mockContainer.appendChild(p1);
    
    (renderAsync as jest.Mock).mockImplementation(async (buffer: ArrayBuffer, container: HTMLElement) => {
      container.innerHTML = mockContainer.innerHTML;
      return container;
    });

    // 模拟
    const fileContent = new Uint8Array([]);
    const file = new File([fileContent], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => fileContent.buffer
    });
    
    const dropZone = screen.getByText('拖拽 Word 文档到这里或点击上传').parentElement!;

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });
  }
  it('普通文本', async () => {
    
    mockRender(`<span>Hello</span>
      <span>World</span>
      <span>Test</span>
      <span>Docx</span>`)
    // 等待异步操作完成
    await screen.findByText(/分析结果/);
    
    expect(screen.getByText(/Hello/)).toBeDefined();
    expect(screen.getByText(/无粗体/)).toBeDefined();

    expect(screen.getByText(/World/)).toBeDefined();
    expect(screen.getByText(/无下划线/)).toBeDefined();

    expect(screen.getByText(/Test/)).toBeDefined();
    expect(screen.getByText(/默认字号/)).toBeDefined();
  });

  it('普通样式命中', async () => {
    
    mockRender(`<span style="font-weight: bold">Hello</span>
      <span style="text-decoration: underline">World</span>
      <span style="font-size: 30px">Test</span>`)
    // 等待异步操作完成
    await screen.findByText(/分析结果/);
    
    expect(screen.getByText(/Hello/)).toBeDefined();
    expect(screen.getByText(/是粗体/)).toBeDefined();

    expect(screen.getByText(/World/)).toBeDefined();
    expect(screen.getByText(/有下划线/)).toBeDefined();

    expect(screen.getByText(/Test/)).toBeDefined();
    expect(screen.getByText(/30px/)).toBeDefined();
  });

  it('普通样式测试2', async () => {
    
    mockRender(`<span style="font-weight: 700">Hello</span>
      <span style="text-decoration: line-through">World</span>
      <span style="font-size: inherit">Test</span>`)
    // 等待异步操作完成
    await screen.findByText(/分析结果/);
    
    expect(screen.getByText(/Hello/)).toBeDefined();
    expect(screen.getByText(/是粗体/)).toBeDefined();

    expect(screen.getByText(/World/)).toBeDefined();
    expect(screen.getByText(/无下划线/)).toBeDefined();

    expect(screen.getByText(/Test/)).toBeDefined();
    expect(screen.getByText(/默认字号/)).toBeDefined();
  });

  it('样式重叠', async () => {
    mockRender(`<span style="font-weight: bold; font-size: 20px; text-decoration: line-through">Hello</span>
      <span style="text-decoration: underline; font-weight: 700; color: red">World</span>
      <span style="font-size: 40px; text-decoration: overline; font-style: italic">Test</span>`)
    // 等待异步操作完成
    await screen.findByText(/分析结果/);
    
    expect(screen.getByText(/Hello/)).toBeDefined();
    expect(screen.getByText(/是粗体/)).toBeDefined();

    expect(screen.getByText(/World/)).toBeDefined();
    expect(screen.getByText(/有下划线/)).toBeDefined();

    expect(screen.getByText(/Test/)).toBeDefined();
    expect(screen.getByText(/40px/)).toBeDefined();
  });
}); 