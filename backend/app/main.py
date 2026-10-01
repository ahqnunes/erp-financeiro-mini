from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api.clientes import router as clientes_router
from .api.finance import router as finance_router
from .config import get_settings

settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="API do Mini-ERP Financeiro.",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)
app.include_router(clientes_router)
app.include_router(finance_router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, error: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"error": "Dados inválidos."},
    )


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, error: HTTPException) -> JSONResponse:
    detail = error.detail if isinstance(error.detail, str) else "Erro na requisição."
    return JSONResponse(status_code=error.status_code, content={"error": detail})


@app.get("/api/health", tags=["Health"])
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "Mini-ERP Financeiro & BI",
        "version": "1.0.0",
        "timestamp": datetime.now().astimezone().isoformat(),
    }


@app.get("/api/docs/openapi.json", include_in_schema=False)
def openapi_document() -> dict:
    return app.openapi()


@app.get("/api/docs", include_in_schema=False)
def api_docs():
    return get_swagger_ui_html(
        openapi_url="/api/docs/openapi.json",
        title=f"{settings.app_name} - API",
    )


frontend_dir = Path(
    settings.frontend_dir or Path(__file__).resolve().parents[2] / "dist"
)
if frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
