import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Wand2, X, FileText, Filter, ChevronDown, ChevronUp, Copy, ClipboardPaste } from 'lucide-react';
import { diffLines } from 'diff';
import axios from 'axios';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

const JsonDiffPage = () => {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState([]);
  const [error, setError] = useState('');
  const [url, setUrl] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  const [ignoreOptions, setIgnoreOptions] = useState({
    fieldPaths: '',
    regexPattern: '',
    ignoreDynamicValues: false,
    ignoreTypes: []
  });
  
  const [fieldPathSuggestions, setFieldPathSuggestions] = useState([]);
  const [showPathSuggestions, setShowPathSuggestions] = useState(false);
  
  const diffRef = useRef(null);
  const pathInputRef = useRef(null);

  const formatJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString || '{}');
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      setError('JSON格式错误: ' + e.message);
      return jsonString;
    }
  };

  const formatLeftJson = () => {
    setLeftJson(formatJson(leftJson));
  };

  const formatRightJson = () => {
    setRightJson(formatJson(rightJson));
  };

  // 粘贴到左侧JSON
  const pasteLeftJson = async () => {
    try {
      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setLeftJson(text);
        toast.success('已粘贴到JSON1');
        return;
      }
      
      // 备选方案：使用传统方法
      const textarea = document.createElement('textarea');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      
      if (document.execCommand('paste')) {
        setLeftJson(textarea.value);
        toast.success('已粘贴到JSON1');
      } else {
        toast.error('粘贴失败: 请手动粘贴 (Ctrl+V)');
      }
      
      document.body.removeChild(textarea);
    } catch (err) {
      toast.error('粘贴失败: ' + err.message + '，请手动粘贴 (Ctrl+V)');
    }
  };

  // 粘贴到右侧JSON
  const pasteRightJson = async () => {
    try {
      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setRightJson(text);
        toast.success('已粘贴到JSON2');
        return;
      }
      
      // 备选方案：使用传统方法
      const textarea = document.createElement('textarea');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      
      if (document.execCommand('paste')) {
        setRightJson(textarea.value);
        toast.success('已粘贴到JSON2');
      } else {
        toast.error('粘贴失败: 请手动粘贴 (Ctrl+V)');
      }
      
      document.body.removeChild(textarea);
    } catch (err) {
      toast.error('粘贴失败: ' + err.message + '，请手动粘贴 (Ctrl+V)');
    }
  };

  // 复制左侧JSON到剪贴板
  const copyLeftJson = () => {
    if (!leftJson) {
      toast.error('JSON1内容为空');
      return;
    }
    
    try {
      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(leftJson)
          .then(() => {
            toast.success('JSON1已复制到剪贴板');
          })
          .catch(err => {
            // 备选方案：使用传统方法
            copyWithExecCommand(leftJson);
          });
      } else {
        // 使用传统方法
        copyWithExecCommand(leftJson);
      }
    } catch (err) {
      toast.error('复制失败: ' + err.message);
    }
  };

  // 复制右侧JSON到剪贴板
  const copyRightJson = () => {
    if (!rightJson) {
      toast.error('JSON2内容为空');
      return;
    }
    
    try {
      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rightJson)
          .then(() => {
            toast.success('JSON2已复制到剪贴板');
          })
          .catch(err => {
            // 备选方案：使用传统方法
            copyWithExecCommand(rightJson);
          });
      } else {
        // 使用传统方法
        copyWithExecCommand(rightJson);
      }
    } catch (err) {
      toast.error('复制失败: ' + err.message);
    }
  };

  // 使用传统execCommand复制文本
  const copyWithExecCommand = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      if (successful) {
        toast.success('已复制到剪贴板');
      } else {
        toast.error('复制失败: 请手动复制 (Ctrl+C)');
      }
    } catch (err) {
      document.body.removeChild(textarea);
      toast.error('复制失败: ' + err.message);
    }
  };

  const fetchJsonFromUrl = async () => {
    if (!url) {
      setError('请输入URL');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await axios.get(proxyUrl, { timeout: 15000 });
      
      if (response.data && response.data.contents) {
        const jsonData = JSON.parse(response.data.contents);
        setLeftJson(JSON.stringify(jsonData, null, 2));
      } else {
        throw new Error('无法获取数据');
      }
      
    } catch (err) {
      let errorMessage = `请求失败: ${err.message}`;
      
      if (err.response) {
        errorMessage += ` (状态码: ${err.response.status})`;
        if (err.response.data) {
          if (typeof err.response.data === 'string' && err.response.data.includes('Cloudflare')) {
            errorMessage += ' - 请求被安全服务拦截';
          } else {
            errorMessage += ` - ${JSON.stringify(err.response.data).substring(0, 100)}...`;
          }
        }
      } else if (err.request) {
        errorMessage += ' (无响应)';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (json) => {
    try {
      let parsed = JSON.parse(json || '{}');
      
      if (ignoreOptions.ignoreDynamicValues) {
        parsed = filterDynamicValues(parsed);
      }
      
      if (ignoreOptions.fieldPaths) {
        const paths = ignoreOptions.fieldPaths.split(',').map(p => p.trim());
        parsed = filterByPaths(parsed, paths);
      }
      
      if (ignoreOptions.regexPattern) {
        const regex = new RegExp(ignoreOptions.regexPattern);
        parsed = filterByRegex(parsed, regex);
      }
      
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return json;
    }
  };

  const filterDynamicValues = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => filterDynamicValues(item));
    }
    
    const result = {};
    for (const key in obj) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) continue;
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) continue;
      }
      
      result[key] = filterDynamicValues(value);
    }
    
    return result;
  };

  const filterByPaths = (obj, paths, currentPath = '') => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        filterByPaths(item, paths, `${currentPath}[${index}]`)
      );
    }
    
    const result = {};
    for (const key in obj) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (paths.some(path => fullPath.startsWith(path))) {
        continue;
      }
      
      result[key] = filterByPaths(obj[key], paths, fullPath);
    }
    
    return result;
  };

  const filterByRegex = (obj, regex, currentPath = '') => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        filterByRegex(item, regex, `${currentPath}[${index}]`)
      );
    }
    
    const result = {};
    for (const key in obj) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (regex.test(fullPath)) {
        continue;
      }
      
      result[key] = filterByRegex(obj[key], regex, fullPath);
    }
    
    return result;
  };

  const extractFieldPaths = (obj, currentPath = '', paths = []) => {
    if (typeof obj !== 'object' || obj === null) return paths;
    
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        extractFieldPaths(item, `${currentPath}[${index}]`, paths);
      });
      return paths;
    }
    
    for (const key in obj) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      paths.push(fullPath);
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractFieldPaths(obj[key], fullPath, paths);
      }
    }
    
    return paths;
  };

  const getFieldPathSuggestions = (inputValue) => {
    try {
      const jsonObj = JSON.parse(leftJson || '{}');
      const allPaths = extractFieldPaths(jsonObj);
      
      const uniquePaths = [...new Set(allPaths)];
      return uniquePaths.filter(path => 
        path.toLowerCase().includes(inputValue.toLowerCase())
      );
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    if (leftJson && showPathSuggestions) {
      const suggestions = getFieldPathSuggestions(ignoreOptions.fieldPaths);
      setFieldPathSuggestions(suggestions);
    }
  }, [leftJson, ignoreOptions.fieldPaths, showPathSuggestions]);

  const compareJson = () => {
    setError('');
    try {
      const filteredLeft = applyFilters(leftJson);
      const filteredRight = applyFilters(rightJson);
      
      const parsedLeft = JSON.parse(filteredLeft || '{}');
      const parsedRight = JSON.parse(filteredRight || '{}');
      
      const leftStr = JSON.stringify(parsedLeft, null, 2);
      const rightStr = JSON.stringify(parsedRight, null, 2);
      
      const differences = diffLines(leftStr, rightStr);
      setDiffResult(differences);
    } catch (e) {
      setError('JSON格式错误: ' + e.message);
      setDiffResult([]);
    }
  };

  const clearAll = () => {
    setLeftJson('');
    setRightJson('');
    setDiffResult([]);
    setError('');
    setUrl('');
  };

  const generatePDFReport = async () => {
    if (!diffRef.current || diffResult.length === 0) {
      setError('没有差异结果可生成报告');
      return;
    }
    
    setIsGeneratingPDF(true);
    setError('');
    
    try {
      const dataUrl = await toPng(diffRef.current, {
        backgroundColor: '#f3f4f6',
        quality: 0.95
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (diffRef.current.scrollHeight / diffRef.current.scrollWidth) * imgWidth;
      
      pdf.setFont('helvetica');
      
      pdf.setFontSize(18);
      pdf.text('JSON差异检测报告', 105, 15, null, null, 'center');
      
      pdf.setFontSize(10);
      pdf.text(`生成时间: ${new Date().toLocaleString()}`, 105, 22, null, null, 'center');
      
      pdf.addImage(dataUrl, 'PNG', 10, 30, imgWidth, imgHeight);
      
      pdf.setFontSize(12);
      pdf.setTextColor(220, 53, 69);
      pdf.text('■ 删除的内容', 20, imgHeight + 35);
      pdf.setTextColor(25, 135, 84);
      pdf.text('■ 新增的内容', 70, imgHeight + 35);
      pdf.setTextColor(0, 0, 0);
      
      pdf.save('json-diff-report.pdf');
    } catch (err) {
      setError('生成PDF失败: ' + err.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateIgnoreOption = (key, value) => {
    setIgnoreOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const selectPathSuggestion = (path) => {
    const currentPaths = ignoreOptions.fieldPaths ? ignoreOptions.fieldPaths.split(',').map(p => p.trim()) : [];
    
    if (currentPaths.includes(path)) {
      updateIgnoreOption('fieldPaths', currentPaths.filter(p => p !== path).join(', '));
    } else {
      updateIgnoreOption('fieldPaths', [...currentPaths, path].join(', '));
    }
    
    setShowPathSuggestions(true);
    setTimeout(() => pathInputRef.current?.focus(), 0);
  };

  const copyDiffResult = () => {
    if (diffResult.length === 0) {
      toast.error('没有差异结果可复制');
      return;
    }
    
    const diffText = diffResult.map(part => part.value).join('');
    
    try {
      // 尝试使用现代剪贴板API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(diffText)
          .then(() => {
            toast.success('差异结果已复制到剪贴板');
          })
          .catch(err => {
            // 备选方案：使用传统方法
            copyWithExecCommand(diffText);
          });
      } else {
        // 使用传统方法
        copyWithExecCommand(diffText);
      }
    } catch (err) {
      toast.error('复制失败: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">JSON 差异比较工具</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4 relative">
          <div className="absolute top-3 right-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setError('')}
              className="text-white opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Terminal className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API 请求</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex gap-2 w-full">
              <Select value={httpMethod} onValueChange={setHttpMethod}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="方法" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="输入请求URL"
                className="flex-1"
              />
              
              <Button 
                onClick={fetchJsonFromUrl}
                disabled={isLoading}
              >
                {isLoading ? "请求中..." : "发送请求"}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>提示：使用公共API时可能需要代理服务解决跨域问题</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>JSON 1</CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={formatLeftJson}
                className="flex items-center gap-1"
              >
                <Wand2 className="h-4 w-4" />
                格式化
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={pasteLeftJson}
                className="flex items-center gap-1"
                title="粘贴到JSON1"
              >
                <ClipboardPaste className="h-4 w-4" />
                粘贴
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyLeftJson}
                className="flex items-center gap-1"
                title="复制JSON1"
              >
                <Copy className="h-4 w-4" />
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={leftJson}
              onChange={(e) => setLeftJson(e.target.value)}
              placeholder="在此粘贴第一段JSON"
              className="min-h-[300px] font-mono"
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>JSON 2</CardTitle>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={formatRightJson}
                className="flex items-center gap-1"
              >
                <Wand2 className="h-4 w-4" />
                格式化
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={pasteRightJson}
                className="flex items-center gap-1"
                title="粘贴到JSON2"
              >
                <ClipboardPaste className="h-4 w-4" />
                粘贴
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyRightJson}
                className="flex items-center gap-1"
                title="复制JSON2"
              >
                <Copy className="h-4 w-4" />
                复制
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={rightJson}
              onChange={(e) => setRightJson(e.target.value)}
              placeholder="在此粘贴第二段JSON"
              className="min-h-[300px] font-mono"
            />
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            比较过滤选项
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>忽略字段路径</Label>
                <div className="relative">
                  <Input
                    ref={pathInputRef}
                    value={ignoreOptions.fieldPaths}
                    onChange={(e) => updateIgnoreOption('fieldPaths', e.target.value)}
                    onFocus={() => setShowPathSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowPathSuggestions(false), 200)}
                    placeholder="例如: data.timestamp, user.id"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowPathSuggestions(!showPathSuggestions)}
                  >
                    {showPathSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  
                  {showPathSuggestions && leftJson && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {fieldPathSuggestions.length > 0 ? (
                        fieldPathSuggestions.map((path, index) => (
                          <div 
                            key={index}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => selectPathSuggestion(path)}
                          >
                            {path}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          未找到匹配的字段路径
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">多个路径用逗号分隔</p>
              </div>
              
              <div>
                <Label>正则表达式过滤</Label>
                <Input
                  value={ignoreOptions.regexPattern}
                  onChange={(e) => updateIgnoreOption('regexPattern', e.target.value)}
                  placeholder="例如: .*\.id 忽略所有id字段"
                />
                <p className="text-xs text-gray-500 mt-1">使用正则表达式匹配字段路径</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="dynamic-values" 
                  checked={ignoreOptions.ignoreDynamicValues}
                  onCheckedChange={(checked) => updateIgnoreOption('ignoreDynamicValues', checked)}
                />
                <Label htmlFor="dynamic-values">忽略动态值</Label>
                <p className="text-xs text-gray-500 ml-2">(时间戳、UUID等)</p>
              </div>
              
              <div>
                <Label>忽略类型</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['string', 'number', 'boolean', 'null'].map(type => (
                    <Button
                      key={type}
                      variant={ignoreOptions.ignoreTypes.includes(type) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newTypes = ignoreOptions.ignoreTypes.includes(type)
                          ? ignoreOptions.ignoreTypes.filter(t => t !== type)
                          : [...ignoreOptions.ignoreTypes, type];
                        updateIgnoreOption('ignoreTypes', newTypes);
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">选择要忽略的数据类型</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex gap-4 mb-6">
        <Button onClick={compareJson}>比较差异</Button>
        <Button variant="outline" onClick={clearAll}>清空所有</Button>
        <Button 
          onClick={generatePDFReport}
          disabled={diffResult.length === 0 || isGeneratingPDF}
          className="flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          {isGeneratingPDF ? "生成中..." : "生成PDF报告"}
        </Button>
      </div>
      
      {diffResult.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>差异结果</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={copyDiffResult}
              className="flex items-center gap-1"
            >
              <Copy className="h-4 w-4" />
              复制结果
            </Button>
          </CardHeader>
          <CardContent>
            <pre 
              ref={diffRef}
              className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]"
            >
              {diffResult.map((part, index) => {
                const color = part.added ? 'bg-green-200' : 
                             part.removed ? 'bg-red-200' : '';
                return (
                  <span key={index} className={`${color} block whitespace-pre-wrap`}>
                    {part.value}
                  </span>
                );
              })}
            </pre>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-200 mr-2"></div>
                <span>删除的内容</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-200 mr-2"></div>
                <span>新增的内容</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default JsonDiffPage;
