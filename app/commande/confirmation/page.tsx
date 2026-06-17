import ConfirmationClient from './ConfirmationClient'

export default function Confirmation({ searchParams }: { searchParams: { num?: string } }) {
  return <ConfirmationClient num={searchParams.num} />
}
