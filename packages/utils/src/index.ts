export const calcularIMC = (pesoKg: number, alturaCm: number) =>
  Number((pesoKg / Math.pow(alturaCm/100, 2)).toFixed(2))

export const classificarIMC = (imc: number) => {
  if (imc < 18.5) return 'Abaixo do peso'
  if (imc < 25)   return 'Peso normal'
  if (imc < 30)   return 'Sobrepeso'
  if (imc < 35)   return 'Obesidade grau I'
  if (imc < 40)   return 'Obesidade grau II'
  return 'Obesidade grau III'
}

export const formatarCPF = (cpf: string) =>
  cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')

export const formatarTelefone = (tel: string) =>
  tel.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')

export const calcularIdade = (dataNascimento: string) => {
  const hoje = new Date(), nasc = new Date(dataNascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}
