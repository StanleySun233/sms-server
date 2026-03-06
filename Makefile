.PHONY: help dev prod pull up down restart logs clean rebuild

help: ## 显示帮助信息
	@echo "SMS Server Docker 管理命令"
	@echo ""
	@echo "开发环境:"
	@echo "  make dev         - 启动开发环境 (从源代码构建)"
	@echo "  make dev-build   - 重新构建并启动开发环境"
	@echo "  make dev-down    - 停止开发环境"
	@echo ""
	@echo "生产环境:"
	@echo "  make prod        - 启动生产环境 (使用预构建镜像)"
	@echo "  make pull        - 拉取最新的 Docker 镜像"
	@echo "  make update      - 更新到最新版本 (拉取 + 重启)"
	@echo ""
	@echo "通用命令:"
	@echo "  make up          - 启动所有服务"
	@echo "  make down        - 停止所有服务"
	@echo "  make restart     - 重启所有服务"
	@echo "  make logs        - 查看所有服务日志"
	@echo "  make ps          - 查看服务状态"
	@echo "  make clean       - 停止并删除所有容器和卷"
	@echo ""
	@echo "数据库:"
	@echo "  make db-backup   - 备份数据库"
	@echo "  make db-restore  - 恢复数据库"
	@echo "  make db-shell    - 进入数据库命令行"

# 开发环境
dev: ## 启动开发环境
	docker-compose -f docker-compose.dev.yml up -d
	@echo "开发环境已启动！"
	@echo "前端: http://localhost:${FRONTEND_PORT:-3000}"
	@echo "后端: http://localhost:${BACKEND_PORT:-8080}"

dev-build: ## 重新构建并启动开发环境
	docker-compose -f docker-compose.dev.yml up -d --build

dev-down: ## 停止开发环境
	docker-compose -f docker-compose.dev.yml down

dev-logs: ## 查看开发环境日志
	docker-compose -f docker-compose.dev.yml logs -f

# 生产环境
prod: ## 启动生产环境
	docker-compose up -d
	@echo "生产环境已启动！"
	@echo "访问: http://localhost"

pull: ## 拉取最新镜像
	docker-compose pull

update: pull ## 更新到最新版本
	docker-compose up -d
	@echo "已更新到最新版本！"

# 通用命令
up: ## 启动服务
	docker-compose up -d

down: ## 停止服务
	docker-compose down

restart: down up ## 重启服务

logs: ## 查看日志
	docker-compose logs -f

ps: ## 查看服务状态
	docker-compose ps

# 清理
clean: ## 停止并删除所有容器和卷（警告：会删除数据）
	@echo "警告：此操作将删除所有数据！按 Ctrl+C 取消..."
	@sleep 5
	docker-compose down -v

rebuild: clean ## 完全重建（清理 + 构建 + 启动）
	docker-compose up -d --build

# 数据库操作
db-backup: ## 备份数据库
	@mkdir -p backups
	@echo "备份数据库..."
	docker-compose exec -T mysql mysqldump -u root -p$${MYSQL_ROOT_PASSWORD} $${MYSQL_DATABASE} > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "备份完成: backups/backup_$$(date +%Y%m%d_%H%M%S).sql"

db-restore: ## 恢复数据库（需要指定 FILE=backup.sql）
	@if [ -z "$(FILE)" ]; then \
		echo "错误：请指定备份文件，例如: make db-restore FILE=backups/backup.sql"; \
		exit 1; \
	fi
	@echo "恢复数据库从 $(FILE)..."
	docker-compose exec -T mysql mysql -u root -p$${MYSQL_ROOT_PASSWORD} $${MYSQL_DATABASE} < $(FILE)
	@echo "恢复完成！"

db-shell: ## 进入数据库命令行
	docker-compose exec mysql mysql -u root -p$${MYSQL_ROOT_PASSWORD} $${MYSQL_DATABASE}

# 服务特定命令
backend-logs: ## 查看后端日志
	docker-compose logs -f backend

frontend-logs: ## 查看前端日志
	docker-compose logs -f frontend

backend-shell: ## 进入后端容器
	docker-compose exec backend sh

frontend-shell: ## 进入前端容器
	docker-compose exec frontend sh
