import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Wand2 } from 'lucide-react';
import { diffLines } from 'diff';

const JsonDiffPage = () => {
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [diffResult, setDiffResult] = useState([]);
  const [error, setError] = useState('');

  // 格式化JSON函数
  const formatJson = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString || '{}');
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      setError('JSON格式错误: ' + e.message);
      return jsonString;
    }
  };

  // 格式化左侧JSON
  const formatLeftJson = () => {
    setLeftJson(formatJson(leftJson));
  };

  // 格式化右侧JSON
  const formatRightJson = () => {
    setRightJson(formatJson(rightJson));
  };

  const compareJson = () => {
    setError('');
    try {
      // 尝试解析JSON
      const parsedLeft = JSON.parse(leftJson || '{}');
      const parsedRight = JSON.parse(rightJson || '{}');
      
      // 格式化JSON字符串用于比较
      const leftStr = JSON.stringify(parsedLeft, null, 2);
      const rightStr = JSON.stringify(parsedRight, null, 2);
      
      // 执行差异比较
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
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">JSON DIFF</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>JSON 1</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={formatLeftJson}
              className="flex items-center gap-1"
            >
              <Wand2 className="h-4 w-4" />
              格式化
            </Button>
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={formatRightJson}
              className="flex items-center gap-1"
            >
              <Wand2 className="h-4 w-4" />
              格式化
            </Button>
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
      
      <div className="flex gap-4 mb-6">
        <Button onClick={compareJson}>比较</Button>
        <Button variant="outline" onClick={clearAll}>清空</Button>
      </div>
      
      {diffResult.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>差异结果</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[500px]">
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
