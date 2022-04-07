import { buyToken, Execute } from '@reservoir0x/client-sdk'
import useCollection from 'hooks/useCollection'
import * as Dialog from '@radix-ui/react-dialog'
import React, { FC, useState } from 'react'
import { useSigner } from 'wagmi'
import { CgSpinner } from 'react-icons/cg'
import ModalCard from './ModalCard'
import Error from './Error'

// Load environment variables using the appropiate Next.js
// nomenclature
// https://nextjs.org/docs/basic-features/environment-variables#exposing-environment-variables-to-the-browser
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
const API_BASE = process.env.NEXT_PUBLIC_API_BASE

const Buy: FC = () => {
  // wagmi hooks
  const [{ data: signer }] = useSigner()

  // Steps are shown in the modal to inform user about the
  // progress of execution for the current action.
  // The steps variable will be updated by the client SDK
  const [steps, setSteps] = useState<Execute['steps']>()

  // Loading state for the action button
  const [waitingTx, setWaitingTx] = useState<boolean>(false)

  // Error state for the action button
  const [error, setError] = useState<any>(undefined)

  // Control the open state for the modal
  const [open, setOpen] = useState(false)

  // Load the collection's floor token using
  // the `/collection/v1` endpoint
  // MAINNET: https://api.reservoir.tools/#/4.%20NFT%20API/getCollectionV1
  // RINKEBY: https://api-rinkeby.reservoir.tools/#/4.%20NFT%20API/getCollectionV1
  const collection = useCollection()

  // Extract the token ID of the first index of the user's tokens
  const tokenId = collection.data?.collection?.floorAsk?.token?.tokenId
  // Construct the token with the format `{contract-address}:{token-id}`
  const token = `${CONTRACT_ADDRESS}:${tokenId}`

  // Close the modal and reset parameters
  const close = () => {
    // Close modal
    setOpen(false)
    // Reset steps
    setSteps(undefined)
    // Toggle off waiting state
    setWaitingTx(false)
  }

  // Execute the following function when the transaction has been
  // completed sucessfully
  const handleSuccess: Parameters<typeof buyToken>[0]['handleSuccess'] = () => {
    // Refetch data from `/collection/v1`
    collection && collection.mutate()
    // Remove the error message, if any
    setError(undefined)
  }

  // Execute the following function when the transaction has been
  // failed
  const handleError: Parameters<typeof buyToken>[0]['handleError'] = (
    err: any
  ) => {
    // Close the steps modal
    close()

    // Differentiate error messages
    if (err?.message === 'Taker does not have sufficient balance') {
      // Set the error message in the UI
      setError(
        <Error>
          Insufficient funds.{' '}
          <a
            href="https://faucet.paradigm.xyz/"
            rel="noopener noreferrer nofollow"
            className="underline"
          >
            Top up your Rinkeby ETH
          </a>{' '}
          and try again.
        </Error>
      )
    }
  }

  // Execute this function to buy a token
  const execute = async () => {
    // Set the loading state on
    setWaitingTx(true)

    // Use the client SDK to buy a token
    await buyToken({
      // The token format is `{contract-address}:{token-id}`
      token,
      // Signer is an Ethereum signer object, usually generated by the browser
      signer,
      // The API base url for reservoir
      apiBase: API_BASE,
      setState: setSteps,
      handleSuccess,
      handleError,
    })

    // Set the loading state off
    setWaitingTx(false)
  }

  return (
    <article className="mb-28">
      <div className="reservoir-h6 mb-11">Buy Rinkeby Loot</div>
      {collection.data && !tokenId && (
        <Error>
          No items for sale. Please{' '}
          <a
            href="https://discord.gg/j5K9fESNwh"
            rel="noopener noreferrer nofollow"
            className="underline"
          >
            let us know on Discord.
          </a>
        </Error>
      )}
      {error}
      {/* Use Radix UI to create a modal to display the current state */}
      {/* of execution for the chosen transaction */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          disabled={waitingTx || !signer}
          onClick={execute}
          className="btn-primary-fill w-[222px]"
        >
          {waitingTx ? (
            <CgSpinner className="h-4 w-4 animate-spin" />
          ) : (
            'Buy Now'
          )}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay>
            <ModalCard
              loading={waitingTx}
              title="Buy Now"
              close={close}
              steps={steps}
            />
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </article>
  )
}

export default Buy
