import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import create_engine, Integer, String, Float, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session


DB_HOST = os.getenv("DB_HOST", "mysql")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "employees")
DB_USER = os.getenv("DB_USER", "employee_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "employee_password")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


class Base(DeclarativeBase):
    pass


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    salary: Mapped[float] = mapped_column(Float, nullable=False)


class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: str
    department: str
    designation: str
    salary: float


class EmployeeRead(EmployeeCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)


def init_db():
    Base.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Employee Management API", lifespan=lifespan)


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/employees", response_model=list[EmployeeRead])
def list_employees():
    with Session(engine) as session:
        return session.scalars(select(Employee).order_by(Employee.id.desc())).all()


@app.get("/api/employees/search", response_model=list[EmployeeRead])
def search_employees(q: str = Query(..., min_length=1)):
    pattern = f"%{q}%"
    with Session(engine) as session:
        statement = select(Employee).where(
            (Employee.name.like(pattern))
            | (Employee.email.like(pattern))
            | (Employee.department.like(pattern))
            | (Employee.designation.like(pattern))
        )
        return session.scalars(statement.order_by(Employee.id.desc())).all()


@app.get("/api/employees/{employee_id}", response_model=EmployeeRead)
def get_employee(employee_id: int):
    with Session(engine) as session:
        employee = session.get(Employee, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        return employee


@app.post("/api/employees", response_model=EmployeeRead, status_code=201)
def create_employee(employee_data: EmployeeCreate):
    with Session(engine) as session:
        employee = Employee(**employee_data.model_dump())
        session.add(employee)
        session.commit()
        session.refresh(employee)
        return employee


@app.put("/api/employees/{employee_id}", response_model=EmployeeRead)
def update_employee(employee_id: int, employee_data: EmployeeCreate):
    with Session(engine) as session:
        employee = session.get(Employee, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        for key, value in employee_data.model_dump().items():
            setattr(employee, key, value)

        session.commit()
        session.refresh(employee)
        return employee


@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int):
    with Session(engine) as session:
        employee = session.get(Employee, employee_id)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        session.delete(employee)
        session.commit()
        return {"message": "Employee deleted successfully"}
