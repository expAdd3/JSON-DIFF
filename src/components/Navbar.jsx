import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { navItems } from '../nav-items';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  // 过滤掉首页导航项
  const visibleNavItems = navItems.filter(item => item.to !== '/');
  
  // 判断当前是否在首页
  const isHomePage = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* 移动端菜单按钮 */}
        <div className="md:hidden mr-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <div className="mt-6 space-y-2">
                {visibleNavItems.map((item, index) => (
                  <Button
                    key={index}
                    asChild
                    variant={isActive(item.to) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link to={item.to} className="flex items-center gap-2">
                      {item.icon}
                      {item.title}
                    </Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Logo */}
        <div className="mr-6 flex items-center">
          <Link to="/" className="font-bold hover:underline cursor-pointer">
            开发者工具箱
          </Link>
        </div>
        
        {/* 桌面端导航 - 只显示非首页项 */}
        <nav className="hidden md:flex items-center gap-1">
          {visibleNavItems.map((item, index) => (
            <Button
              key={index}
              asChild
              variant={isActive(item.to) ? "secondary" : "ghost"}
            >
              <Link to={item.to} className="flex items-center gap-1">
                {item.icon}
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* 在右侧添加返回按钮 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">返回</span>
          </Button>
          
          <Button variant="outline" size="sm">
            反馈
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
