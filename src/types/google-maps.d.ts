declare namespace google.maps {
  namespace places {
    interface AutocompleteOptions {
      componentRestrictions?: { country: string | string[] }
      types?: string[]
      fields?: string[]
    }

    interface Autocomplete {
      getPlace(): PlaceResult
      addListener(event: string, handler: () => void): void
    }

    interface PlaceResult {
      address_components?: AddressComponent[]
      formatted_address?: string
    }

    interface AddressComponent {
      long_name: string
      short_name: string
      types: string[]
    }
  }

  namespace event {
    function clearInstanceListeners(instance: object): void
  }
}
