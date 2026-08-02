FROM python:3.11.7-slim

# 创建 /etc/apt/sources.list 文件并配置阿里云镜像源
RUN echo "deb http://mirrors.aliyun.com/debian/ bookworm main non-free non-free-firmware contrib" > /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian-security bookworm-security main non-free non-free-firmware contrib" >> /etc/apt/sources.list && \
    echo "deb http://mirrors.aliyun.com/debian/ bookworm-updates main non-free non-free-firmware contrib" >> /etc/apt/sources.list

# 安装必要的构建工具和依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    make \
    libgl1 \
    libgl1-mesa-glx \
    libglu1-mesa \
    libglib2.0-0 \
    # PDF 处理相关依赖
    libfontconfig1 \
    libfreetype6 \
    libxrender1 \
    libxext6 \
    libx11-6 \
    # 字体支持
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*


# 更新 pip 并配置镜像源
RUN pip config set global.index-url "https://mirrors.aliyun.com/pypi/simple/" && \
    pip config set global.trusted-host "mirrors.aliyun.com" && \
    pip config set global.retries 10 && \
    pip config set global.timeout 120
RUN pip install --upgrade pip setuptools wheel

# 设置工作目录
WORKDIR /app

# 拷贝依赖文件并安装
COPY requirements.txt /app/
RUN for i in 1 2 3 4 5; do \
      pip install --no-cache-dir --default-timeout=180 -r requirements.txt && break || \
      echo "pip install failed, retry $i..." && sleep 5; \
    done

# 拷贝代码
COPY . /app

# 修改文件权限
RUN chmod -R 755 /app

# RUN mkdir -p /usr/local/nltk_data
# COPY /home/zzhan1/nltk_data /usr/local/nltk_data