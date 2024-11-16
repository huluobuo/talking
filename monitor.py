# monitor.py
import json
import time
import tkinter as tk
from tkinter import ttk
from datetime import datetime
import threading
import os

class ChatMonitor:
    def __init__(self, root):
        self.root = root
        self.root.title("聊天监控")
        self.root.geometry("800x600")
        
        # 设置深灰色主题
        self.root.configure(bg='#2c2c2c')
        
        # 配置滚动条颜色
        self.root.tk.call("ttk::style", "configure", "Vertical.TScrollbar", 
                          "-background", "black", 
                          "-troughcolor", "black",
                          "-arrowcolor", "white")

        # 创建和配置样式
        self.style = ttk.Style()
        self.style.configure('TFrame', background='#2c2c2c')
        self.style.configure('TLabelframe', background='#2c2c2c', foreground='#e0e0e0')
        self.style.configure('TLabelframe.Label', background='#2c2c2c', foreground='#e0e0e0')
        self.style.configure('TCheckbutton', background='#2c2c2c', foreground='#e0e0e0')
        self.style.configure('TLabel', background='#2c2c2c', foreground='#e0e0e0')

        # 创建主框架
        self.main_frame = ttk.Frame(root)
        self.main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # 消息区域
        self.messages_frame = ttk.LabelFrame(self.main_frame, text="消息记录", padding=10)
        self.messages_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))

        # 消息文本框和滚动条
        self.messages_scrollbar = ttk.Scrollbar(self.messages_frame)
        self.messages_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.messages_text = tk.Text(
            self.messages_frame, 
            height=10, 
            bg='#3a3a3a',
            fg='#e0e0e0',
            font=('Arial', 10),
            yscrollcommand=self.messages_scrollbar.set
        )
        self.messages_text.pack(fill=tk.BOTH, expand=True)
        self.messages_scrollbar.config(command=self.messages_text.yview)
        self.messages_text.config(state=tk.DISABLED)

        # 消息自动滚动控制
        self.auto_scroll_messages = tk.BooleanVar(value=True)
        self.messages_scroll_check = ttk.Checkbutton(
            self.messages_frame,
            text="自动滚动",
            variable=self.auto_scroll_messages
        )
        self.messages_scroll_check.pack(anchor=tk.W)

        # 统计信息区域
        self.stats_frame = ttk.LabelFrame(self.main_frame, text="统计信息", padding=10)
        self.stats_frame.pack(fill=tk.X, pady=(0, 10))

        self.total_messages_label = ttk.Label(self.stats_frame, text="总消息数: 0")
        self.total_messages_label.pack(side=tk.LEFT, padx=5)

        self.online_users_label = ttk.Label(self.stats_frame, text="在线用户数: 0")
        self.online_users_label.pack(side=tk.LEFT, padx=5)

        # IP 地址区域
        self.ip_frame = ttk.LabelFrame(self.main_frame, text="IP 地址", padding=10)
        self.ip_frame.pack(fill=tk.BOTH)

        # 在线 IP 列表
        self.online_ip_frame = ttk.LabelFrame(self.ip_frame, text="在线 IP", padding=5)
        self.online_ip_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 5))

        self.online_ip_text = tk.Text(
            self.online_ip_frame, 
            height=5, 
            bg='#3a3a3a',
            fg='#e0e0e0',
            insertbackground='#e0e0e0',
            selectbackground='#4a4a4a',
            selectforeground='#ffffff',
            font=('Arial', 10)
        )
        self.online_ip_text.pack(fill=tk.BOTH, expand=True)
        self.online_ip_text.config(state=tk.DISABLED)

        # 黑名单 IP 列表
        self.blacklist_frame = ttk.LabelFrame(self.ip_frame, text="黑名单 IP", padding=5)
        self.blacklist_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(5, 0))

        self.blacklist_text = tk.Text(
            self.blacklist_frame, 
            height=5, 
            bg='#3a3a3a',
            fg='#e0e0e0',
            insertbackground='#e0e0e0',
            selectbackground='#4a4a4a',
            selectforeground='#ffffff',
            font=('Arial', 10)
        )
        self.blacklist_text.pack(fill=tk.BOTH, expand=True)
        self.blacklist_text.config(state=tk.DISABLED)

        # 日志区域
        self.log_frame = ttk.LabelFrame(self.main_frame, text="系统日志", padding=10)
        self.log_frame.pack(fill=tk.BOTH, expand=True)

        # 日志文本框和滚动条
        self.log_scrollbar = ttk.Scrollbar(self.log_frame)
        self.log_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.log_text = tk.Text(
            self.log_frame,
            bg='#3a3a3a',
            fg='#e0e0e0',
            font=('Arial', 10),
            yscrollcommand=self.log_scrollbar.set
        )
        self.log_text.pack(fill=tk.BOTH, expand=True)
        self.log_scrollbar.config(command=self.log_text.yview)
        
        # 日志自动滚动控制
        self.auto_scroll_log = tk.BooleanVar(value=True)
        self.log_scroll_check = ttk.Checkbutton(
            self.log_frame,
            text="自动滚动",
            variable=self.auto_scroll_log
        )
        self.log_scroll_check.pack(anchor=tk.W)

        # 记录上次读取的日志大小
        self.last_log_size = 0
        self.last_log_content = ""

        # 开始更新线程
        self.update_thread = threading.Thread(target=self.update_data, daemon=True)
        self.update_thread.start()

    def read_json_file(self, filename):
        """读取 JSON 文件"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return []

    def read_log_file(self):
        """读取日志文件的新内容"""
        try:
            # 获取当前日志文件大小
            current_size = os.path.getsize('talker.log')
            
            # 如果文件大小没有变化，返回空字符串
            if current_size == self.last_log_size and self.last_log_content:
                return self.last_log_content

            with open('talker.log', 'r', encoding='utf-8') as f:
                content = f.read()
                self.last_log_size = current_size
                self.last_log_content = content
                return content
        except FileNotFoundError:
            return '暂无日志'
        except Exception as e:
            return f'读取日志出错: {str(e)}'

    def update_text_widget(self, widget, content, widget_type='other'):
        """
        更新文本组件的内容
        widget_type 可以是 'message', 'log' 或 'other'
        """
        widget.config(state=tk.NORMAL)
        
        # 检查是否需要更新内容
        current_content = widget.get(1.0, tk.END).strip()
        if content != current_content:
            # 保存当前滚动位置
            current_position = widget.yview()[0]
            
            # 更新内容
            widget.delete(1.0, tk.END)
            widget.insert(tk.END, content)
            
            # 确定是否需要滚动到底部
            if ((widget_type == 'message' and self.auto_scroll_messages.get()) or 
                (widget_type == 'log' and self.auto_scroll_log.get())):
                widget.yview_moveto(1.0)  # 滚动到底部
            else:
                widget.yview_moveto(current_position)  # 恢复原位置
        
        widget.config(state=tk.DISABLED)

    def update_data(self):
        """更新数据的循环"""
        while True:
            try:
                # 读取所有消息
                messages = self.read_json_file('message.json')
                all_messages = '\n'.join(messages if messages else ['无消息'])
                self.root.after(0, lambda: self.update_text_widget(
                    self.messages_text, all_messages, 'message'))

                # 更新统计信息
                self.root.after(0, self.total_messages_label.config, 
                              {'text': f"总消息数: {len(messages)}"})

                # 读取在线 IP
                connected_ips = self.read_json_file('connectedIps.json')
                online_ips = '\n'.join(connected_ips if connected_ips else ['无在线用户'])
                self.root.after(0, lambda: self.update_text_widget(
                    self.online_ip_text, online_ips, 'other'))
                self.root.after(0, self.online_users_label.config, 
                              {'text': f"在线用户数: {len(connected_ips)}"})

                # 读取黑名单
                blacklist = self.read_json_file('Blacklist.json')
                blacklist_ips = '\n'.join(blacklist if blacklist else ['无黑名单'])
                self.root.after(0, lambda: self.update_text_widget(
                    self.blacklist_text, blacklist_ips, 'other'))

                # 读取并更新日志
                log_content = self.read_log_file()
                self.root.after(0, lambda: self.update_text_widget(
                    self.log_text, log_content, 'log'))

                time.sleep(0.5)
            except Exception as e:
                print(f"更新出错: {e}")
                time.sleep(2)

def main():
    root = tk.Tk()
    app = ChatMonitor(root)
    root.mainloop()

if __name__ == "__main__":
    main()