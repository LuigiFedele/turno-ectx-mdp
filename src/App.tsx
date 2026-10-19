import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sun, Moon } from "lucide-react"

import { CICLO_84 } from "./database/ciclo-84"
import { CICLO_42 } from "./database/ciclo-42"
import { CICLO_14 } from "./database/ciclo-14"
import { formatarDataBR } from "./lib/utils"

// ================= CONFIG =================

type Periodo = "manha" | "tarde" | "noite"
type CicloTipo = "84" | "42" | "14"
type TurnoEquipe = "A" | "B" | "C" | "D"

const PERIODOS_INFO: Record<
  Periodo,
  { sigla: string; horario: string; classe: string }
> = {
  manha: {
    sigla: "M",
    horario: "07–15",
    classe: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  tarde: {
    sigla: "T",
    horario: "15–23",
    classe: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  noite: {
    sigla: "N",
    horario: "23–07",
    classe: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
}

// ================= CONFIGURAÇÃO DOS CICLOS =================
const CONFIG_CICLOS = {
  "84": {
    nome: "Escala 49",
    ciclo: CICLO_84,
    tamanho: 84,
    base: new Date("2026-01-01T00:00:00"),
  },
  "42": {
    nome: "Escala 95",
    ciclo: CICLO_42,
    tamanho: 42,
    base: new Date("2026-01-05T00:00:00"),
  },
  "14": {
    nome: "Escala 47",
    ciclo: CICLO_14,
    tamanho: 14,
    base: new Date("2026-01-05T00:00:00"),
  },
}

// ================= FUNÇÕES BASE =================
function diffDias(data: Date, base: Date) {
  const d1 = new Date(data.getFullYear(), data.getMonth(), data.getDate())
  const d2 = new Date(base.getFullYear(), base.getMonth(), base.getDate())
  return Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
}

function getPeriodo(date: Date): Periodo {
  const h = date.getHours() + date.getMinutes() / 60
  if (h >= 7 && h < 15) return "manha"
  if (h >= 15 && h < 23) return "tarde"
  return "noite"
}

function ajustarDataEscala(dateTime: Date, periodo: Periodo) {
  if (periodo === "noite" && dateTime.getHours() < 7) {
    return new Date(
      dateTime.getFullYear(),
      dateTime.getMonth(),
      dateTime.getDate() - 1
    )
  }

  return new Date(
    dateTime.getFullYear(),
    dateTime.getMonth(),
    dateTime.getDate()
  )
}

// ================= FUNÇÃO GENÉRICA =================
function getEscala(dateTime: Date, tipo: CicloTipo) {
  const config = CONFIG_CICLOS[tipo]

  const periodo = getPeriodo(dateTime)
  const dataEscala = ajustarDataEscala(dateTime, periodo)

  const dias = diffDias(dataEscala, config.base)
  const indice =
    ((dias % config.tamanho) + config.tamanho) % config.tamanho

  const escalaDia = config.ciclo[indice]

  return {
    periodoAtual: periodo,
    turnoAtual: escalaDia?.[periodo as keyof typeof escalaDia] ?? "FOLGA",
    periodos: escalaDia,
  }
}

function getTurnosDisponiveis(tipo: CicloTipo): TurnoEquipe[] {
  if (tipo === "84") return ["A", "B", "C", "D"]
  if (tipo === "42") return ["A", "B", "C"]
  return ["A", "B"]
}

function getPeriodoDoTurno(
  data: Date,
  tipo: CicloTipo,
  turno: TurnoEquipe
): Periodo | null {
  const periodos = getEscala(data, tipo).periodos
  const periodo = Object.entries(periodos ?? {}).find(
    ([, turnoEscalado]) => turnoEscalado === turno
  )?.[0]

  if (periodo === "manha" || periodo === "tarde" || periodo === "noite") {
    return periodo
  }
  return null
}

function CalendarioAnual({
  ano,
  tipo,
  turno,
}: {
  ano: number
  tipo: CicloTipo
  turno: TurnoEquipe
}) {
  const meses = Array.from({ length: 12 }, (_, mes) => {
    const primeiroDia = new Date(ano, mes, 1)
    const diasNoMes = new Date(ano, mes + 1, 0).getDate()

    return {
      nome: primeiroDia.toLocaleDateString("pt-BR", { month: "long" }),
      deslocamento: primeiroDia.getDay(),
      dias: Array.from({ length: diasNoMes }, (_, indice) => indice + 1),
    }
  })
  const hoje = new Date()

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {meses.map((mes, indiceMes) => (
        <Card key={mes.nome}>
          <CardHeader className="pb-3">
            <CardTitle className="capitalize">
              {mes.nome} / {ano}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((dia, indice) => (
                <div key={`${dia}-${indice}`} className="pb-1 font-medium">
                  {dia}
                </div>
              ))}
              {Array.from({ length: mes.deslocamento }, (_, indice) => (
                <div key={`vazio-${indice}`} aria-hidden="true" />
              ))}
              {mes.dias.map((dia) => {
                const data = new Date(ano, indiceMes, dia, 12)
                const periodo = getPeriodoDoTurno(data, tipo, turno)
                const infoPeriodo = periodo ? PERIODOS_INFO[periodo] : null
                const ehHoje =
                  data.getDate() === hoje.getDate() &&
                  data.getMonth() === hoje.getMonth() &&
                  data.getFullYear() === hoje.getFullYear()
                const dataFormatada = data.toLocaleDateString("pt-BR")

                return (
                  <div
                    key={dia}
                    title={`${dataFormatada}: ${
                      infoPeriodo
                        ? `trabalha das ${infoPeriodo.horario}`
                        : "folga"
                    }`}
                    aria-label={`${dataFormatada}: ${
                      infoPeriodo
                        ? `trabalha das ${infoPeriodo.horario}`
                        : "folga"
                    }`}
                    className={`flex min-h-12 flex-col items-center justify-center rounded-md border text-xs ${
                      infoPeriodo
                        ? infoPeriodo.classe
                        : "border-border bg-muted/30 text-muted-foreground"
                    } ${ehHoje ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`}
                  >
                    <span className="font-medium">{dia}</span>
                    <span className="font-bold">{infoPeriodo?.sigla ?? "F"}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ================= COMPONENTE =================
export default function App() {
  const [agora, setAgora] = useState(new Date())
  const [cicloSelecionado, setCicloSelecionado] = useState<CicloTipo>("84")
  const [cicloAnual, setCicloAnual] = useState<CicloTipo>("84")
  const [turnoAnual, setTurnoAnual] = useState<TurnoEquipe>("A")
  const [anoAnual, setAnoAnual] = useState(new Date().getFullYear())
  const [dataSelecionada, setDataSelecionada] = useState(() => {
    const hoje = new Date()
    return hoje.toISOString().split("T")[0]
  })

  const [dark, setDark] = useState(() => {
    const temaSalvo = localStorage.getItem("tema")
    if (temaSalvo) return temaSalvo === "dark"
    return true
  })

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("tema", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("tema", "light")
    }
  }, [dark])

  // ================= TURNO NO MOMENTO =================
  const turno84 = getEscala(agora, "84").turnoAtual
  const turno42 = getEscala(agora, "42").turnoAtual
  const turno14 = getEscala(agora, "14").turnoAtual

  // ================= ESCALA DATA SELECIONADA =================
  const dataBase = new Date(`${dataSelecionada}T12:00:00`)
  const escalaDiaSelecionado = getEscala(dataBase, cicloSelecionado)

  const turnosDisponiveis = getTurnosDisponiveis(cicloSelecionado)

  const turnosDoDia: Record<string, string> = {}
  turnosDisponiveis.forEach((t) => (turnosDoDia[t] = "FOLGA"))

  if (escalaDiaSelecionado.periodos) {
    Object.entries(escalaDiaSelecionado.periodos).forEach(
      ([periodo, turno]) => {
        if (turno) {
          const label =
            periodo === "manha"
              ? "07–15"
              : periodo === "tarde"
              ? "15–23"
              : "23–07"
          turnosDoDia[turno as string] = label
        }
      }
    )
  }

  // ================= UI =================
  return (
  <div className="min-h-screen bg-background text-foreground p-6">
    <div className="max-w-6xl mx-auto space-y-8">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Sistema de Consulta de Escalas - Eucatex MDP
          </h1>
          <p className="text-muted-foreground text-sm">
            Consulte rapidamente qual turno está ativo agora ou verifique qualquer data futura.
             <br />
             <br /> Ressaltamos que a ferramenta tem caráter informativo e de apoio, não substituindo as comunicações e controles oficiais do RH.
          </p>
        </div>

        <Button variant="outline" size="icon" onClick={() => setDark(!dark)}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>

      {/* TURNO NO MOMENTO */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          🔴 Turno em funcionamento neste momento
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          O sistema identifica automaticamente o horário atual e mostra qual turno está operando agora.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Escala 49 (Turnos A, B, C, D)</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-bold text-center">
              {turno84}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escala 95 (Turnos A, B, C)</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-bold text-center">
              {turno42}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escala 47 (Turnos A, B)</CardTitle>
            </CardHeader>
            <CardContent className="text-4xl font-bold text-center">
              {turno14}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CONSULTA POR DATA */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          📅 Consultar escala por data
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione a escala desejada e escolha uma data para visualizar quais turnos estarão trabalhando e quais estarão de folga.
        </p>

        <Card>
          <CardContent className="space-y-6 pt-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Tipo de escala
                </label>
                <select
                  value={cicloSelecionado}
                  onChange={(e) =>
                    setCicloSelecionado(e.target.value as CicloTipo)
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="84">Escala 49</option>
                  <option value="42">Escala 95</option>
                  <option value="14">Escala 47</option>
                </select>

              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  Data desejada
                </label>
                <Input
                  type="date"
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                />

              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Resultado para <strong>{formatarDataBR(dataSelecionada)}</strong>:
              </p>


              <div
                className={`grid gap-4 ${
                  turnosDisponiveis.length === 4
                    ? "md:grid-cols-4"
                    : turnosDisponiveis.length === 3
                    ? "md:grid-cols-3"
                    : "md:grid-cols-2"
                }`}
              >
                {turnosDisponiveis.map((turno) => (
                  <Card
                    key={turno}
                    className={`text-center ${
                      turnosDoDia[turno] === "FOLGA"
                        ? "opacity-60"
                        : "border-2 border-primary"
                    }`}
                  >
                    <CardHeader>
                      <CardTitle>Turno {turno}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-lg font-semibold">
                      {turnosDoDia[turno] === "FOLGA"
                        ? "Folga"
                        : `Trabalha das ${turnosDoDia[turno]}`}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* CONSULTA ANUAL */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          🗓️ Consultar escala anual
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Selecione o ano, a escala e o turno para consultar os dias de trabalho
          e de folga ao longo do ano.
        </p>

        <Card>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="ano-anual" className="text-sm font-medium">
                  Ano
                </label>
                <input
                  id="ano-anual"
                  type="number"
                  min="100"
                  step="1"
                  value={anoAnual}
                  onChange={(e) => {
                    const ano = e.currentTarget.valueAsNumber
                    if (Number.isInteger(ano) && ano >= 100) {
                      setAnoAnual(ano)
                    }
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="escala-anual" className="text-sm font-medium">
                  Tipo de escala
                </label>
                <select
                  id="escala-anual"
                  value={cicloAnual}
                  onChange={(e) => {
                    const novoCiclo = e.target.value as CicloTipo
                    setCicloAnual(novoCiclo)
                    if (!getTurnosDisponiveis(novoCiclo).includes(turnoAnual)) {
                      setTurnoAnual("A")
                    }
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="84">Escala 49</option>
                  <option value="42">Escala 95</option>
                  <option value="14">Escala 47</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="turno-anual" className="text-sm font-medium">
                  Turno
                </label>
                <select
                  id="turno-anual"
                  value={turnoAnual}
                  onChange={(e) =>
                    setTurnoAnual(e.target.value as TurnoEquipe)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {getTurnosDisponiveis(cicloAnual).map((turno) => (
                    <option key={turno} value={turno}>
                      Turno {turno}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              {Object.entries(PERIODOS_INFO).map(([periodo, info]) => (
                <span key={periodo} className="flex items-center gap-2">
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded border text-xs font-bold ${info.classe}`}
                  >
                    {info.sigla}
                  </span>
                  {info.horario}
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded border border-border bg-muted/30 text-xs font-bold text-muted-foreground">
                  F
                </span>
                Folga
              </span>
            </div>

            <CalendarioAnual
              ano={anoAnual}
              tipo={cicloAnual}
              turno={turnoAnual}
            />
          </CardContent>
        </Card>
      </div>
    </div>

    <footer className="max-w-5xl mx-auto mt-10 text-center text-s text-muted-foreground">
      Desenvolvido por Luigi Fedele.
    </footer>
  </div>
)
}
